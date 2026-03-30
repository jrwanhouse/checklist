-- Migration: Password Reset & Email Verification
-- Run once against the checklist database

USE checklist;

ALTER TABLE usuarios
  ADD COLUMN email_verificado    TINYINT(1)   NOT NULL DEFAULT 0    AFTER ativo,
  ADD COLUMN verificacao_token   VARCHAR(128) NULL                   AFTER email_verificado,
  ADD COLUMN verificacao_expiry  DATETIME     NULL                   AFTER verificacao_token,
  ADD COLUMN reset_token         VARCHAR(128) NULL                   AFTER verificacao_expiry,
  ADD COLUMN reset_expiry        DATETIME     NULL                   AFTER reset_token;
