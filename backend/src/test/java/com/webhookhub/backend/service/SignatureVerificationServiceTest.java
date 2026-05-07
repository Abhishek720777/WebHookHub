package com.webhookhub.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SignatureVerificationService Tests")
class SignatureVerificationServiceTest {

    private final SignatureVerificationService verificationService = new SignatureVerificationService();

    @Test
    @DisplayName("Should verify valid HMAC-SHA256 signature")
    void shouldVerifyValidSignature() {
        String payload = "{\"hello\":\"world\"}";
        String secret = "my-secret";
        // Computed manually or via online tool for HMAC-SHA256
        // echo -n '{"hello":"world"}' | openssl dgst -sha256 -hmac "my-secret"
        String signature = "a477339812d59f527176183f700b4f848b3e6e5bf3796ab25b6e0d0ccaeb96a4"; 

        boolean result = verificationService.verifyHmacSha256(payload, signature, secret);
        
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should verify valid signature with 'sha256=' prefix")
    void shouldVerifySignatureWithPrefix() {
        String payload = "{\"hello\":\"world\"}";
        String secret = "my-secret";
        String signature = "sha256=a477339812d59f527176183f700b4f848b3e6e5bf3796ab25b6e0d0ccaeb96a4"; 

        boolean result = verificationService.verifyHmacSha256(payload, signature, secret);
        
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false for invalid signature")
    void shouldFailForInvalidSignature() {
        String payload = "{\"hello\":\"world\"}";
        String secret = "my-secret";
        String signature = "wrong-signature"; 

        boolean result = verificationService.verifyHmacSha256(payload, signature, secret);
        
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false when secret is null")
    void shouldFailWhenSecretIsNull() {
        boolean result = verificationService.verifyHmacSha256("{}", "sig", null);
        assertThat(result).isFalse();
    }
}
