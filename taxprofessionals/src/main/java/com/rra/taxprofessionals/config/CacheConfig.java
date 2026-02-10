package com.rra.taxprofessionals.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Cache configuration for system settings.
 * Uses Caffeine cache (built into Spring Boot) for in-memory caching.
 * No external dependencies like Redis required.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("systemStatus");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS) // Cache for 30 seconds
                .maximumSize(10) // Small cache, only system status
                .recordStats()); // Enable statistics for monitoring
        return cacheManager;
    }
}
