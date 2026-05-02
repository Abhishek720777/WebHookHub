package com.webhookhub.backend.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String email;
    private String password;
    private String confirmPassword;
    private String otp;
}
