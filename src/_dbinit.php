<?
// File:       _dbinit.php.php
// Contents:   service script to init/modify the database
// Created:    21.01.2021
// Programmer: Edward A. Shiryaev

require_once 'config.php';
require_once 'db.php';
require_once 'util.php';

if(@$_GET['password'] != 'cables')
  exit('Authorization error');
  
        // Database schema SQL-queries as i-array to add new table(s) to the database.
        // total    - number of pieces that the company totally has
        // reserved - number of pieces kept apart by the company (reserved by the company)
  
$SCHEMA_SCRIPT = 
[
  'CREATE TABLE cable
  (
    cableid       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(25) NOT NULL,
    type          ENUM("electrical", "speaker", "microphone", "module", "special", "multi", "c_type"),
    sortno        SMALLINT UNSIGNED NOT NULL DEFAULT 65535,
    weight        INT UNSIGNED,
    
    total         INT UNSIGNED NOT NULL DEFAULT 0,
    reserved      INT UNSIGNED NOT NULL DEFAULT 0,
    
    info          VARCHAR(255),
    link          VARCHAR(255),
    
    timestamp     TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    
    PRIMARY KEY   (cableid),
    UNIQUE KEY    (name)
  ) engine=innoDB collate utf8_general_ci',
  
  
  'CREATE TRIGGER cable_insert BEFORE INSERT ON cable FOR EACH ROW
  BEGIN
    IF NEW.type IS NOT NULL THEN
      SET NEW.sortno = NEW.type * 100;
    END IF;  
  END;',
  
  
  // 'sortno' is auto-calculated by 'type' if new 'type' if specified and not equal to old one; auto-calculated value
  // overrides an explicitly specified 'sortno' value, if any; so fune-tuning 'sortno' is only possible if 'type' is not
  // changing when updating
  'CREATE TRIGGER cable_update BEFORE UPDATE ON cable FOR EACH ROW
  BEGIN
    IF NEW.type IS NOT NULL AND (NEW.type != OLD.type OR OLD.type IS NULL) THEN
      SET NEW.sortno = NEW.type * 100;
    ELSEIF NEW.type IS NULL AND OLD.type IS NOT NULL THEN
      SET NEW.sortno = 65535;
    END IF;
  END;',
  
  
  'CREATE TABLE affair
  (
    affairid      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    tech_id       INT UNSIGNED NOT NULL,
    tech_name     VARCHAR(50) NOT NULL,
    
    name          VARCHAR(50) NOT NULL,
    ref           VARCHAR(50),
    
    prep_date     DATE,
    prep_time     ENUM("morning", "afternoon"),
    receipt_date  DATE NOT NULL,
    receipt_time  ENUM("morning", "afternoon"),
    return_date   DATE NOT NULL,
    return_time   ENUM("morning", "afternoon"),
    
    front         BOOLEAN NOT NULL DEFAULT 0,
    monitor       BOOLEAN NOT NULL DEFAULT 0,
    stage         BOOLEAN NOT NULL DEFAULT 0,
  
    master_note   TEXT,
    tech_note     TEXT,
    
    done          BOOLEAN NOT NULL DEFAULT 0,
    
    timestamp     TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    
    PRIMARY KEY   (affairid),
    UNIQUE KEY    (tech_id, name, receipt_date),
    UNIQUE KEY    (tech_id, ref, receipt_date)
  ) engine=innoDB collate utf8_general_ci',
  
  
  // a cable from 'cable' table cannot be deleted if there are orders for this cable
  'CREATE TABLE `order`
  (
    orderid       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    cableid       INT UNSIGNED NOT NULL,
    affairid      INT UNSIGNED NOT NULL,
    tech_id       INT UNSIGNED NOT NULL,

    count         INT UNSIGNED NOT NULL DEFAULT 0,
    spare_count   INT UNSIGNED NOT NULL DEFAULT 0,
    done          BOOLEAN NOT NULL DEFAULT 0,
    
    tfc1          INT UNSIGNED NOT NULL DEFAULT 0,
    tfc2          INT UNSIGNED NOT NULL DEFAULT 0,
    tfc3          INT UNSIGNED NOT NULL DEFAULT 0,
    tfc4          INT UNSIGNED NOT NULL DEFAULT 0,
    tfc5          INT UNSIGNED NOT NULL DEFAULT 0,
    tfc_done      BOOLEAN NOT NULL DEFAULT 0, 
    
    timestamp     TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  
    PRIMARY KEY   (orderid),
    UNIQUE KEY    (cableid, affairid, tech_id),
    FOREIGN KEY   (cableid) REFERENCES cable (cableid) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY   (affairid) REFERENCES affair(affairid) ON UPDATE CASCADE ON DELETE RESTRICT
  ) engine=innoDB collate utf8_general_ci',
  
  
  // tech_id - who currently uses an MFC, if any
  // affairid - on which affair an MFC is used, if any
  'CREATE TABLE mfc
  (
    mfcid         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(50) NOT NULL,
    info          VARCHAR(255),
    tech_id       INT UNSIGNED,
    affairid      INT UNSIGNED,
    
    PRIMARY KEY   (mfcid),
    UNIQUE KEY    (name),
    FOREIGN KEY   (affairid) REFERENCES affair(affairid) ON UPDATE CASCADE ON DELETE RESTRICT
  ) engine=innoDB collate utf8_general_ci',
  
  
  'CREATE TABLE cablemfc
  (
    mfcid         INT UNSIGNED NOT NULL,
    cableid       INT UNSIGNED NOT NULL,
    count         INT UNSIGNED NOT NULL,
    
    PRIMARY KEY   (mfcid, cableid),
    FOREIGN KEY   (mfcid) REFERENCES mfc(mfcid) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY   (cableid) REFERENCES cable(cableid) ON UPDATE CASCADE ON DELETE RESTRICT
  ) engine=innoDB collate utf8_general_ci',
];

foreach($SCHEMA_SCRIPT as $query) {
  echo util::textChunk($query, 50), str_repeat('&nbsp;', 50);
  if(db::query($query, false /* silent */))
    echo 'done', '<br>';
  else
    echo db::error(), '<br>';
}
  
echo '<br>Database inited!';
?>