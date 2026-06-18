package com.aoop.aooplost;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class AoopLostApplication {

	public static void main(String[] args) {
		SpringApplication.run(AoopLostApplication.class, args);
	}

}
