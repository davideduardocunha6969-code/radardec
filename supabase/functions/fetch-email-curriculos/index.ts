import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_");
}

// Simple base64 decode for attachment content
function decodeBase64(data: string): Uint8Array {
  const binaryString = atob(data.replace(/\s/g, ""));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode quoted-printable encoded strings
function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Decode MIME encoded words (=?charset?encoding?text?=)
function decodeMimeWord(str: string): string {
  return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, _charset, encoding, text) => {
    if (encoding.toUpperCase() === "B") {
      try { return atob(text); } catch { return text; }
    } else {
      return decodeQuotedPrintable(text.replace(/_/g, " "));
    }
  });
}

// Parse a MIME email to extract attachments
function parseMimeAttachments(source: string): Array<{ filename: string; content: Uint8Array; contentType: string }> {
  const attachments: Array<{ filename: string; content: Uint8Array; contentType: string }> = [];

  // Find boundary
  const boundaryMatch = source.match(/boundary="?([^";\r\n]+)"?/i);
  if (!boundaryMatch) return attachments;

  const boundary = boundaryMatch[1];
  const parts = source.split("--" + boundary);

  for (const part of parts) {
    if (part.trim() === "--" || part.trim() === "") continue;

    // Check for attachment
    const contentDisp = part.match(/Content-Disposition:\s*attachment[^]*?filename="?([^";\r\n]+)"?/i);
    const contentDispInline = part.match(/Content-Disposition:\s*[^]*?filename="?([^";\r\n]+)"?/i);
    const nameMatch = part.match(/name="?([^";\r\n]+)"?/i);

    let filename = contentDisp?.[1] || contentDispInline?.[1] || nameMatch?.[1] || "";
    filename = decodeMimeWord(filename).trim();

    if (!filename) continue;

    const lowerName = filename.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".doc") && !lowerName.endsWith(".docx")) continue;

    // Get content type
    const ctMatch = part.match(/Content-Type:\s*([^;\r\n]+)/i);
    const contentType = ctMatch?.[1]?.trim() || "application/octet-stream";

    // Get transfer encoding
    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const encoding = encodingMatch?.[1]?.trim().toLowerCase() || "7bit";

    // Extract body (after double newline)
    const bodyStart = part.indexOf("\r\n\r\n");
    if (bodyStart === -1) continue;
    const body = part.substring(bodyStart + 4);

    let content: Uint8Array;
    if (encoding === "base64") {
      try {
        content = decodeBase64(body);
      } catch {
        continue;
      }
    } else {
      const encoder = new TextEncoder();
      content = encoder.encode(body);
    }

    attachments.push({ filename, content, contentType });
  }

  return attachments;
}

// Simple IMAP client using raw TCP
class SimpleIMAP {
  private conn!: Deno.TlsConn;
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private buffer = "";
  private tagCounter = 0;

  constructor(
    private host: string,
    private port: number,
    private user: string,
    private pass: string
  ) {}

  private async readLine(): Promise<string> {
    while (!this.buffer.includes("\r\n")) {
      const { value, done } = await this.reader.read();
      if (done) throw new Error("Connection closed");
      this.buffer += new TextDecoder().decode(value);
    }
    const idx = this.buffer.indexOf("\r\n");
    const line = this.buffer.substring(0, idx);
    this.buffer = this.buffer.substring(idx + 2);
    return line;
  }

  private async readUntilTag(tag: string): Promise<string[]> {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      lines.push(line);
      if (line.startsWith(tag + " ")) break;
    }
    return lines;
  }

  private async sendCommand(cmd: string): Promise<string[]> {
    this.tagCounter++;
    const tag = `A${String(this.tagCounter).padStart(4, "0")}`;
    const fullCmd = `${tag} ${cmd}\r\n`;
    const encoder = new TextEncoder();
    const writer = this.conn.writable.getWriter();
    await writer.write(encoder.encode(fullCmd));
    writer.releaseLock();
    return this.readUntilTag(tag);
  }

  async connect(): Promise<void> {
    this.conn = await Deno.connectTls({
      hostname: this.host,
      port: this.port,
    });
    this.reader = this.conn.readable.getReader();
    // Read greeting
    await this.readLine();
  }

  async login(): Promise<void> {
    const escapedUser = `"${this.user.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    const escapedPass = `"${this.pass.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    const result = await this.sendCommand(`LOGIN ${escapedUser} ${escapedPass}`);
    const lastLine = result[result.length - 1];
    if (!lastLine.includes("OK")) {
      throw new Error(`Login failed: ${lastLine}`);
    }
  }

  async selectInbox(): Promise<void> {
    await this.sendCommand("SELECT INBOX");
  }

  async searchUnseen(): Promise<number[]> {
    const result = await this.sendCommand("SEARCH UNSEEN");
    const uids: number[] = [];
    for (const line of result) {
      if (line.startsWith("* SEARCH")) {
        const parts = line.replace("* SEARCH", "").trim().split(/\s+/);
        for (const p of parts) {
          const num = parseInt(p, 10);
          if (!isNaN(num)) uids.push(num);
        }
      }
    }
    return uids;
  }

  async fetchMessage(seqNum: number): Promise<string> {
    const result = await this.sendCommand(`FETCH ${seqNum} BODY[]`);
    // The response contains literal data
    let fullBody = "";
    for (const line of result) {
      fullBody += line + "\r\n";
    }
    return fullBody;
  }

  async markAsRead(seqNum: number): Promise<void> {
    await this.sendCommand(`STORE ${seqNum} +FLAGS (\\Seen)`);
  }

  async logout(): Promise<void> {
    try {
      await this.sendCommand("LOGOUT");
    } catch {
      // ignore
    }
    try {
      this.reader.releaseLock();
      this.conn.close();
    } catch {
      // ignore
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const imapHost = Deno.env.get("IMAP_HOST");
    const imapUser = Deno.env.get("IMAP_USER");
    const imapPassword = Deno.env.get("IMAP_PASSWORD");

    if (!imapHost || !imapUser || !imapPassword) {
      throw new Error("IMAP credentials not configured (IMAP_HOST, IMAP_USER, IMAP_PASSWORD)");
    }

    console.log(`Connecting to IMAP: ${imapHost} as ${imapUser}`);

    const client = new SimpleIMAP(imapHost, 993, imapUser, imapPassword);
    await client.connect();
    console.log("IMAP connected, logging in...");

    await client.login();
    console.log("IMAP logged in");

    await client.selectInbox();
    console.log("INBOX selected");

    const unseenMessages = await client.searchUnseen();
    console.log(`Found ${unseenMessages.length} unread messages`);

    if (unseenMessages.length === 0) {
      await client.logout();
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum email não lido encontrado", processedCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const processedEmails: string[] = [];

    for (const seqNum of unseenMessages) {
      try {
        const source = await client.fetchMessage(seqNum);
        
        // Extract subject and from
        const subjectMatch = source.match(/^Subject:\s*(.+)$/im);
        const fromMatch = source.match(/^From:\s*(.+)$/im);
        const subject = subjectMatch ? decodeMimeWord(subjectMatch[1].trim()) : "(sem assunto)";
        const from = fromMatch ? decodeMimeWord(fromMatch[1].trim()) : "unknown";

        console.log(`Processing email from: ${from}, subject: ${subject}`);

        const attachments = parseMimeAttachments(source);

        if (attachments.length === 0) {
          console.log(`Email "${subject}" has no CV attachments, skipping`);
          await client.markAsRead(seqNum);
          continue;
        }

        for (const attachment of attachments) {
          try {
            const sanitizedName = sanitizeFileName(attachment.filename);
            const filePath = `banco-talentos/${Date.now()}-${sanitizedName}`;

            console.log(`Uploading attachment: ${attachment.filename} -> ${filePath}`);

            const { error: uploadError } = await supabase.storage
              .from("curriculos")
              .upload(filePath, attachment.content, {
                contentType: attachment.contentType,
              });

            if (uploadError) {
              console.error(`Upload error for ${attachment.filename}:`, uploadError);
              errors.push(`Upload falhou: ${attachment.filename} - ${uploadError.message}`);
              errorCount++;
              continue;
            }

            const { data: result, error: analysisError } = await supabase.functions.invoke(
              "analyze-curriculum-all-vagas",
              {
                body: {
                  bucket: "curriculos",
                  filePath,
                  fileName: attachment.filename,
                },
              }
            );

            if (analysisError) {
              console.error(`Analysis error for ${attachment.filename}:`, analysisError);
              errors.push(`Análise falhou: ${attachment.filename} - ${analysisError.message}`);
              errorCount++;
            } else {
              processedCount++;
              processedEmails.push(`${from}: ${attachment.filename} (${result?.vagasAnalisadas || 0} vagas)`);
              console.log(`Successfully processed: ${attachment.filename}`);
            }
          } catch (attErr: any) {
            console.error(`Error processing attachment:`, attErr);
            errors.push(`Erro: ${attachment.filename} - ${attErr.message}`);
            errorCount++;
          }
        }

        await client.markAsRead(seqNum);
        console.log(`Marked email ${seqNum} as read`);
      } catch (msgErr: any) {
        console.error(`Error processing message ${seqNum}:`, msgErr);
        errors.push(`Erro no email ${seqNum}: ${msgErr.message}`);
        errorCount++;
      }
    }

    await client.logout();
    console.log("IMAP disconnected");

    return new Response(
      JSON.stringify({
        success: true,
        processedCount,
        errorCount,
        processedEmails,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in fetch-email-curriculos:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
