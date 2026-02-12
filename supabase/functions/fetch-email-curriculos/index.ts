import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "npm:imapflow@1.0.171";
import { simpleParser } from "npm:mailparser@3.7.2";

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

    const client = new ImapFlow({
      host: imapHost,
      port: 993,
      secure: true,
      auth: { user: imapUser, pass: imapPassword },
      logger: false,
    });

    await client.connect();
    console.log("IMAP connected");

    const lock = await client.getMailboxLock("INBOX");
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const processedEmails: string[] = [];

    try {
      // Search for unseen (unread) messages
      const unseenMessages = await client.search({ seen: false });
      console.log(`Found ${unseenMessages.length} unread messages`);

      if (unseenMessages.length === 0) {
        lock.release();
        await client.logout();
        return new Response(
          JSON.stringify({ success: true, message: "Nenhum email não lido encontrado", processedCount: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process each unread message
      for (const uid of unseenMessages) {
        try {
          // Fetch the full message source
          const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
          
          if (!message?.source) {
            console.log(`Message ${uid}: no source, skipping`);
            continue;
          }

          // Parse the email
          const parsed = await simpleParser(message.source);
          const subject = parsed.subject || "(sem assunto)";
          const from = parsed.from?.text || "unknown";
          
          console.log(`Processing email from: ${from}, subject: ${subject}`);

          // Filter attachments (PDF, DOC, DOCX only)
          const validAttachments = (parsed.attachments || []).filter((att: any) => {
            const name = (att.filename || "").toLowerCase();
            return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
          });

          if (validAttachments.length === 0) {
            console.log(`Email "${subject}" has no CV attachments, skipping`);
            // Still mark as read since we checked it
            await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
            continue;
          }

          // Process each attachment
          for (const attachment of validAttachments) {
            try {
              const fileName = attachment.filename || `curriculo-${Date.now()}.pdf`;
              const sanitizedName = sanitizeFileName(fileName);
              const filePath = `banco-talentos/${Date.now()}-${sanitizedName}`;

              console.log(`Uploading attachment: ${fileName} -> ${filePath}`);

              // Upload to storage
              const fileBuffer = attachment.content;
              const { error: uploadError } = await supabase.storage
                .from("curriculos")
                .upload(filePath, fileBuffer, {
                  contentType: attachment.contentType || "application/pdf",
                });

              if (uploadError) {
                console.error(`Upload error for ${fileName}:`, uploadError);
                errors.push(`Upload falhou: ${fileName} - ${uploadError.message}`);
                errorCount++;
                continue;
              }

              // Call analyze-curriculum-all-vagas to process
              const { data: result, error: analysisError } = await supabase.functions.invoke(
                "analyze-curriculum-all-vagas",
                {
                  body: {
                    bucket: "curriculos",
                    filePath,
                    fileName,
                  },
                }
              );

              if (analysisError) {
                console.error(`Analysis error for ${fileName}:`, analysisError);
                errors.push(`Análise falhou: ${fileName} - ${analysisError.message}`);
                errorCount++;
              } else {
                processedCount++;
                processedEmails.push(`${from}: ${fileName} (${result?.vagasAnalisadas || 0} vagas)`);
                console.log(`Successfully processed: ${fileName}`);
              }
            } catch (attErr: any) {
              console.error(`Error processing attachment:`, attErr);
              errors.push(`Erro: ${attachment.filename} - ${attErr.message}`);
              errorCount++;
            }
          }

          // Mark email as read
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          console.log(`Marked email ${uid} as read`);
        } catch (msgErr: any) {
          console.error(`Error processing message ${uid}:`, msgErr);
          errors.push(`Erro no email ${uid}: ${msgErr.message}`);
          errorCount++;
        }
      }
    } finally {
      lock.release();
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
