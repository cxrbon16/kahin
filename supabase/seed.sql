-- Kâhin — team seed data: OFFICIAL FIFA World Cup 2026 final draw.
-- Draw held 5 December 2025, Kennedy Center, Washington D.C.
-- 48 teams, 12 groups of 4. Position order = draw slot (1..4); players
-- reorder freely, so the within-group order here is only the default display.
-- Re-running is safe (upsert by team id).

insert into teams (id, name, flag, group_code) values
  -- Group A
  ('MEX','Meksika','🇲🇽','A'),
  ('RSA','Güney Afrika','🇿🇦','A'),
  ('KOR','Güney Kore','🇰🇷','A'),
  ('CZE','Çekya','🇨🇿','A'),
  -- Group B
  ('CAN','Kanada','🇨🇦','B'),
  ('BIH','Bosna-Hersek','🇧🇦','B'),
  ('QAT','Katar','🇶🇦','B'),
  ('SUI','İsviçre','🇨🇭','B'),
  -- Group C
  ('BRA','Brezilya','🇧🇷','C'),
  ('MAR','Fas','🇲🇦','C'),
  ('HAI','Haiti','🇭🇹','C'),
  ('SCO','İskoçya','🏴󠁧󠁢󠁳󠁣󠁴󠁿','C'),
  -- Group D
  ('USA','ABD','🇺🇸','D'),
  ('PAR','Paraguay','🇵🇾','D'),
  ('AUS','Avustralya','🇦🇺','D'),
  ('TUR','Türkiye','🇹🇷','D'),
  -- Group E
  ('GER','Almanya','🇩🇪','E'),
  ('CUW','Curaçao','🇨🇼','E'),
  ('CIV','Fildişi Sahili','🇨🇮','E'),
  ('ECU','Ekvador','🇪🇨','E'),
  -- Group F
  ('NED','Hollanda','🇳🇱','F'),
  ('JPN','Japonya','🇯🇵','F'),
  ('SWE','İsveç','🇸🇪','F'),
  ('TUN','Tunus','🇹🇳','F'),
  -- Group G
  ('BEL','Belçika','🇧🇪','G'),
  ('EGY','Mısır','🇪🇬','G'),
  ('IRN','İran','🇮🇷','G'),
  ('NZL','Yeni Zelanda','🇳🇿','G'),
  -- Group H
  ('ESP','İspanya','🇪🇸','H'),
  ('CPV','Cabo Verde','🇨🇻','H'),
  ('KSA','Suudi Arabistan','🇸🇦','H'),
  ('URU','Uruguay','🇺🇾','H'),
  -- Group I
  ('FRA','Fransa','🇫🇷','I'),
  ('SEN','Senegal','🇸🇳','I'),
  ('IRQ','Irak','🇮🇶','I'),
  ('NOR','Norveç','🇳🇴','I'),
  -- Group J
  ('ARG','Arjantin','🇦🇷','J'),
  ('ALG','Cezayir','🇩🇿','J'),
  ('AUT','Avusturya','🇦🇹','J'),
  ('JOR','Ürdün','🇯🇴','J'),
  -- Group K
  ('POR','Portekiz','🇵🇹','K'),
  ('COD','Demokratik Kongo','🇨🇩','K'),
  ('UZB','Özbekistan','🇺🇿','K'),
  ('COL','Kolombiya','🇨🇴','K'),
  -- Group L
  ('ENG','İngiltere','🏴󠁧󠁢󠁥󠁮󠁧󠁿','L'),
  ('CRO','Hırvatistan','🇭🇷','L'),
  ('GHA','Gana','🇬🇭','L'),
  ('PAN','Panama','🇵🇦','L')
on conflict (id) do update
  set name = excluded.name,
      flag = excluded.flag,
      group_code = excluded.group_code;
