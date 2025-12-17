package com.rra.taxprofessionals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@SpringBootApplication
public class TaxprofessionalsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaxprofessionalsApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void checkEnvironmentVariables() {
        log.info("========================================");
        log.info("🔍 ENVIRONMENT VARIABLES CHECK");
        log.info("========================================");
        log.info("MAIL_USERNAME: {}", System.getenv("MAIL_USERNAME"));
        log.info("EMAIL_MOCK_ENABLED: {}", System.getenv("EMAIL_MOCK_ENABLED"));
        String mailPassword = System.getenv("MAIL_PASSWORD");
        log.info("MAIL_PASSWORD: {}***",
                mailPassword != null && mailPassword.length() >= 4
                ? mailPassword.substring(0, 4) : "NOT SET");
        log.info("========================================");
    }

}
