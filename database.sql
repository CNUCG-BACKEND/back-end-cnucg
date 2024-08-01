-- Habilita autocommit para garantir que todas as mudanças sejam automaticamente salvas
SET autocommit = 1;

-- Habilita o modo estrito para garantir a integridade dos dados
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

DROP DATABASE IF EXISTS caes_guia;
CREATE DATABASE caes_guia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE caes_guia;

-- TABELAS

CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  sexo ENUM('masc', 'fem', 'nao-bin') NOT NULL,
  data_nascimento DATE NOT NULL,
  endereco_logradouro VARCHAR(50) NOT NULL,
  endereco_numero VARCHAR(10) NOT NULL,
  endereco_complemento VARCHAR(50),
  endereco_cep VARCHAR(8) NOT NULL,
  endereco_cidade VARCHAR(30) NOT NULL,
  endereco_estado VARCHAR(2) NOT NULL,
  endereco_bairro VARCHAR(30) NOT NULL,
  email VARCHAR(40) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  rg VARCHAR(15) NOT NULL UNIQUE,
  telefone VARCHAR(15) NOT NULL,
  id_instituicao INT,
  PRIMARY KEY (id)
);

CREATE TABLE instituicoes (
  id INT NOT NULL AUTO_INCREMENT,
  razao_social VARCHAR(40) NOT NULL,
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  endereco_logradouro VARCHAR(50) NOT NULL,
  endereco_numero VARCHAR(10) NOT NULL,
  endereco_complemento VARCHAR(50),
  endereco_cep VARCHAR(8) NOT NULL,
  endereco_cidade VARCHAR(30) NOT NULL,
  endereco_estado VARCHAR(2) NOT NULL,
  endereco_bairro VARCHAR(30) NOT NULL,
  email VARCHAR(40) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE caes_guia (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(25) NOT NULL,
  sexo ENUM('masc', 'fem') NOT NULL,
  cor VARCHAR(15) NOT NULL,
  data_nascimento DATE NOT NULL,
  raca VARCHAR(20) NOT NULL,
  numero_registro INT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  id_instituicao INT,
  id_usuario INT,
  PRIMARY KEY (id)
);

CREATE TABLE validacao (
  id INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  data_contato DATE NOT NULL,
  meio_contato VARCHAR(30) NOT NULL,
  observacoes VARCHAR(50),
  PRIMARY KEY (id)
);

CREATE TABLE documentos (
  id INT NOT NULL AUTO_INCREMENT,
  descricao VARCHAR(50) NOT NULL,
  path VARCHAR(50) NOT NULL,
  id_usuario INT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE status_cao_guia (
  id INT NOT NULL AUTO_INCREMENT,
  status_descricao VARCHAR(50) NOT NULL,
  status_tipo VARCHAR(15) NOT NULL,
  status_data DATE NOT NULL,
  id_cao INT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE forma_dupla (
  id_usuario INT NOT NULL,
  id_cao INT NOT NULL,
  inicio_dupla DATE NOT NULL,
  fim_dupla DATE,
  motivo_fim_dupla TEXT,
  PRIMARY KEY (id_usuario, id_cao)
);

-- RELACIONAMENTOS

ALTER TABLE usuarios
  ADD FOREIGN KEY (id_instituicao) REFERENCES instituicoes(id);

ALTER TABLE caes_guia
  ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  ADD FOREIGN KEY (id_instituicao) REFERENCES instituicoes(id);

ALTER TABLE validacao
  ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id);

ALTER TABLE documentos
  ADD FOREIGN KEY (id_usuario) REFERENCES validacao(id_usuario);

ALTER TABLE status_cao_guia
  ADD FOREIGN KEY (id_cao) REFERENCES caes_guia(id);

ALTER TABLE forma_dupla
  ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
  ADD FOREIGN KEY (id_cao) REFERENCES caes_guia(id);

ALTER TABLE usuarios ADD COLUMN status_validacao ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente';
ALTER TABLE usuarios ADD COLUMN motivo_rejeicao VARCHAR(255) DEFAULT NULL;
ALTER TABLE instituicoes ADD COLUMN status_validacao ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente';
ALTER TABLE instituicoes ADD COLUMN motivo_rejeicao VARCHAR(255) DEFAULT NULL;

ALTER TABLE usuarios ADD COLUMN administrador BOOLEAN DEFAULT FALSE;

ALTER TABLE caes_guia ADD COLUMN imagem VARCHAR(255) NULL;

-- Verifica se o usuário já existe antes de tentar criá-lo
DROP USER IF EXISTS 'caes_guia_user'@'localhost';

-- Criar um usuário de banco de dados com permissões limitadas
CREATE USER 'caes_guia_user'@'localhost' IDENTIFIED BY 'senha_segura';

-- Conceder permissões específicas ao usuário criado
GRANT SELECT, INSERT, UPDATE, DELETE ON caes_guia.* TO 'caes_guia_user'@'localhost';

FLUSH PRIVILEGES;