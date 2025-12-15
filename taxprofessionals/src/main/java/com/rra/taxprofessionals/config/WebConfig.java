package com.rra.taxprofessionals.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS is handled by SecurityConfig.corsConfigurationSource()
    // No need for additional CORS configuration here
}
