package com.funnyshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FunnyShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(FunnyShopApplication.class, args);
    }

}
