package com.webhookhub.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String to, String otp) {
        log.info("Sending OTP {} to email {}", otp, to);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("abhishekpoojar69@gmail.com");
            message.setTo(to);
            message.setSubject("WebHookHub - Password Reset OTP");
            message.setText("Your password reset OTP is: " + otp + "\n\nThis code will expire in 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
