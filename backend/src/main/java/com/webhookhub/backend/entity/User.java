package com.webhookhub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String otp;

    @Column(name = "otp_expiry")
    private java.time.LocalDateTime otpExpiry;

    @Column(name = "forward_url")
    private String forwardUrl;
}
