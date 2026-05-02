package com.webhookhub.backend.service;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Cacheable(value = "users", key = "#userId")
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    @CacheEvict(value = "users", key = "#user.id")
    public User saveUser(User user) {
        return userRepository.save(user);
    }
}
