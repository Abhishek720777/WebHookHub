package com.webhookhub.backend.service;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Service
public class SignatureVerificationService {

    public boolean verifyHmacSha256(String payload, String signature, String secret) {
        if (secret == null || signature == null) return false;
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);

            byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);

            // Handle common formats like "sha256=..."
            String actualSignature = signature.contains("=") ? signature.split("=")[1] : signature;
            
            return expectedSignature.equalsIgnoreCase(actualSignature);
        } catch (Exception e) {
            return false;
        }
    }
}
