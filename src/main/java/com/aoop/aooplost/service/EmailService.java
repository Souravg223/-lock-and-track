package com.aoop.aooplost.service;

import com.aoop.aooplost.entity.User;
import com.aoop.aooplost.entity.Match;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
@Slf4j
@EnableAsync
@RequiredArgsConstructor
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    public void sendEmail(String to, String subject, String contentHtml, String contentPlain) {
        // Always log a beautiful stylized ASCII preview to console
        logEmailToConsole(to, subject, contentPlain);

        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(contentPlain, contentHtml);
                helper.setFrom("no-reply@findora-ai.com");
                mailSender.send(message);
                log.info("Successfully sent SMTP email to {}", to);
            } catch (Exception e) {
                log.warn("SMTP Mail delivery failed for {}: {}. (Console Log backup succeeded)", to, e.getMessage());
            }
        } else {
            log.info("SMTP configuration not detected. Mock Email logged successfully.");
        }
    }

    private void logEmailToConsole(String to, String subject, String body) {
        System.out.println("\n");
        System.out.println("=========================================================================");
        System.out.println("                  📩  FINDORA AI SECURE EMAIL SYSTEM  📩                  ");
        System.out.println("=========================================================================");
        System.out.printf("  TO:      %s\n", to);
        System.out.printf("  SUBJECT: %s\n", subject);
        System.out.println("-------------------------------------------------------------------------");
        System.out.println(body);
        System.out.println("=========================================================================");
        System.out.println("\n");
    }

    public void sendAiMatchNotification(User lostUser, User foundUser, Match match) {
        String subject = "🔥 High AI Match Found! Findora Notification";
        
        String plainText = String.format(
            "Dear %s,\n\n" +
            "Great news! Our AI Matching Engine has detected a high similarity match for your reported lost item!\n\n" +
            "Match Percentage: %d%%\n" +
            "Your Lost Item: %s\n" +
            "Finder's Item: %s\n" +
            "Finder's Location: %s\n\n" +
            "Please log in to your Findora Dashboard under 'AI Matches' to accept and view their contact information.\n\n" +
            "Warm regards,\n" +
            "The Findora AI Team",
            lostUser.getFirstName(),
            Math.round(match.getMatchPercentage()),
            match.getLostItem().getTitle(),
            match.getFoundItem().getTitle(),
            match.getFoundItem().getFoundLocation()
        );

        String htmlText = String.format(
            "<h3>Dear %s,</h3>" +
            "<p>Great news! Our AI Matching Engine has detected a high similarity match for your reported lost item!</p>" +
            "<ul>" +
            "<li><strong>Match Percentage:</strong> %d%%</li>" +
            "<li><strong>Your Lost Item:</strong> %s</li>" +
            "<li><strong>Finder's Item:</strong> %s</li>" +
            "<li><strong>Finder's Location:</strong> %s</li>" +
            "</ul>" +
            "<p>Please log in to your <a href='" + frontendUrl + "/dashboard/matches'>Findora Dashboard</a> to coordinate claims.</p>",
            lostUser.getFirstName(),
            Math.round(match.getMatchPercentage()),
            match.getLostItem().getTitle(),
            match.getFoundItem().getTitle(),
            match.getFoundItem().getFoundLocation()
        );

        sendEmail(lostUser.getEmail(), subject, htmlText, plainText);
    }

    public void sendMatchStatusChangedNotification(User recipient, Match match, String newStatus) {
        String subject = "🔔 Match Status Update - Findora AI";
        
        String plainText = String.format(
            "Dear %s,\n\n" +
            "The status of your AI Match (ID: %s) has been updated to: %s!\n\n" +
            "Lost Item: %s\n" +
            "Found Item: %s\n\n" +
            "Please log in to your Findora Account to coordinate the safe recovery of the item.\n\n" +
            "Best,\n" +
            "The Findora AI Team",
            recipient.getFirstName(),
            match.getId().toString().substring(0, 8),
            newStatus,
            match.getLostItem().getTitle(),
            match.getFoundItem().getTitle()
        );

        String htmlText = String.format(
            "<h3>Dear %s,</h3>" +
            "<p>The status of your AI Match has been updated to: <strong>%s</strong>!</p>" +
            "<ul>" +
            "<li><strong>Lost Item:</strong> %s</li>" +
            "<li><strong>Found Item:</strong> %s</li>" +
            "</ul>" +
            "<p>Log in to your <a href='" + frontendUrl + "/dashboard/matches'>AI Matches Panel</a> to communicate.</p>",
            recipient.getFirstName(),
            newStatus,
            match.getLostItem().getTitle(),
            match.getFoundItem().getTitle()
        );

        sendEmail(recipient.getEmail(), subject, htmlText, plainText);
    }

    /**
     * Sent to the Lost Item Owner when AI finds a matching Found Item.
     * This is the fixed, beautiful "Your item was found!" email.
     */
    public void sendItemFoundMatchEmail(User lostUser, Match match) {
        String subject = "🎉 Your Lost Item Has a Match! - Findora AI";

        String itemTitle   = match.getLostItem().getTitle();
        String foundTitle  = match.getFoundItem().getTitle();
        String foundLoc    = match.getFoundItem().getFoundLocation();
        String matchPct    = String.format("%.0f", match.getMatchPercentage());
        String finderName  = match.getFoundItem().getUser().getFirstName()
                           + " " + match.getFoundItem().getUser().getLastName();
        String matchId     = match.getId().toString().substring(0, 8).toUpperCase();

        String plainText = String.format(
            "Dear %s,\n\n" +
            "Great news! Findora AI has found a potential match for your lost item.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            "  MATCH DETAILS\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            "  Your Lost Item  : %s\n" +
            "  Found Item      : %s\n" +
            "  Found Location  : %s\n" +
            "  Finder          : %s\n" +
            "  Match ID        : #%s\n" +
            "  AI Confidence   : %s%%\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "Please log in to your Findora Dashboard and visit the AI Matches section to\n" +
            "review the match and coordinate the safe recovery of your item.\n\n" +
            "  👉 " + frontendUrl + "/dashboard/matches\n\n" +
            "If this is not your item, you can ignore this match.\n\n" +
            "Warm regards,\n" +
            "The Findora AI Team\n" +
            "findora-ai.com",
            lostUser.getFirstName(),
            itemTitle, foundTitle, foundLoc, finderName, matchId, matchPct
        );

        String htmlText =
            "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'>" +
            "<style>" +
            "  body { margin:0; padding:0; background:#0f172a; font-family: 'Segoe UI', Arial, sans-serif; }" +
            "  .wrapper { max-width:600px; margin:40px auto; background:#1e293b; border-radius:16px; overflow:hidden; border:1px solid #334155; }" +
            "  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding:40px 32px; text-align:center; }" +
            "  .header h1 { color:#fff; margin:0; font-size:26px; font-weight:700; letter-spacing:-0.5px; }" +
            "  .header p  { color:#c4b5fd; margin:8px 0 0; font-size:14px; }" +
            "  .badge { display:inline-block; background:rgba(255,255,255,0.15); color:#fff; border-radius:50px; padding:6px 18px; font-size:13px; margin-top:14px; font-weight:600; }" +
            "  .body  { padding:32px; }" +
            "  .greeting { color:#e2e8f0; font-size:17px; margin-bottom:20px; }" +
            "  .card { background:#0f172a; border:1px solid #334155; border-radius:12px; padding:24px; margin:20px 0; }" +
            "  .card-title { color:#818cf8; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px; }" +
            "  .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #1e293b; }" +
            "  .row:last-child { border-bottom:none; }" +
            "  .row-label { color:#64748b; font-size:13px; }" +
            "  .row-value { color:#e2e8f0; font-size:13px; font-weight:600; text-align:right; max-width:60%%; }" +
            "  .pct-bar-bg { background:#1e293b; border-radius:50px; height:8px; margin-top:4px; }" +
            "  .pct-bar-fill { background:linear-gradient(90deg,#6366f1,#8b5cf6); height:8px; border-radius:50px; width:%s%%; }" +
            "  .cta { text-align:center; margin:28px 0 8px; }" +
            "  .cta a { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; padding:14px 32px; border-radius:10px; font-weight:700; font-size:15px; display:inline-block; }" +
            "  .footer { text-align:center; padding:20px 32px 28px; color:#475569; font-size:12px; }" +
            "</style></head><body>" +
            "<div class='wrapper'>" +
            "  <div class='header'>" +
            "    <h1>🎉 Your Item Has a Match!</h1>" +
            "    <p>Findora AI has found a potential match for your lost item</p>" +
            "    <span class='badge'>Match ID: #" + matchId + "</span>" +
            "  </div>" +
            "  <div class='body'>" +
            "    <p class='greeting'>Dear <strong style='color:#a5b4fc'>" + lostUser.getFirstName() + "</strong>,</p>" +
            "    <p style='color:#94a3b8;font-size:14px;line-height:1.7'>" +
            "      Our AI engine has detected a <strong style='color:#6366f1'>" + matchPct + "%%</strong> confidence match" +
            "      for your reported lost item. Here are the details:" +
            "    </p>" +
            "    <div class='card'>" +
            "      <div class='card-title'>📋 Match Details</div>" +
            "      <div class='row'><span class='row-label'>Your Lost Item</span><span class='row-value'>" + itemTitle + "</span></div>" +
            "      <div class='row'><span class='row-label'>Matched Found Item</span><span class='row-value'>" + foundTitle + "</span></div>" +
            "      <div class='row'><span class='row-label'>Found At Location</span><span class='row-value'>" + foundLoc + "</span></div>" +
            "      <div class='row'><span class='row-label'>Finder Name</span><span class='row-value'>" + finderName + "</span></div>" +
            "      <div class='row'>" +
            "        <span class='row-label'>AI Confidence</span>" +
            "        <span class='row-value'>" +
            "          " + matchPct + "%%<br>" +
            "          <div class='pct-bar-bg'><div class='pct-bar-fill'></div></div>" +
            "        </span>" +
            "      </div>" +
            "    </div>" +
            "    <div class='cta'>" +
            "      <a href='" + frontendUrl + "/dashboard/matches'>View My Match &rarr;</a>" +
            "    </div>" +
            "    <p style='color:#475569;font-size:12px;text-align:center;margin-top:16px'>" +
            "      If this does not look like your item, you can safely ignore this email." +
            "    </p>" +
            "  </div>" +
            "  <div class='footer'>" +
            "    &copy; 2025 Findora AI &bull; Secure Item Recovery Platform<br>" +
            "    <span style='color:#334155'>This is an automated message, please do not reply.</span>" +
            "  </div>" +
            "</div></body></html>";

        // Format the %% placeholders for match percentage in the html bar
        String finalHtml = String.format(htmlText, matchPct, matchPct, matchPct);
        sendEmail(lostUser.getEmail(), subject, finalHtml, plainText);
    }

    public void sendPasswordResetOtp(User user, String otp) {
        String subject = "🔑 Password Reset OTP Request - Findora Security";
        
        String plainText = String.format(
            "Dear %s,\n\n" +
            "We received a request to reset the password for your Findora account.\n\n" +
            "Your secure 6-digit OTP verification code is:\n\n" +
            "      %s\n\n" +
            "This code is highly sensitive and will expire in 5 minutes. If you did not make this request, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Findora Cyber Security",
            user.getFirstName(),
            otp
        );

        String htmlText = String.format(
            "<h3>Dear %s,</h3>" +
            "<p>We received a request to reset the password for your Findora account.</p>" +
            "<p>Your secure 6-digit OTP verification code is:</p>" +
            "<h2 style='letter-spacing: 5px; color: #10B981;'>%s</h2>" +
            "<p>This code will expire in <strong>5 minutes</strong>. If you did not request this, please secure your account immediately.</p>",
            user.getFirstName(),
            otp
        );

        sendEmail(user.getEmail(), subject, htmlText, plainText);
    }
}
