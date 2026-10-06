UPDATE `children`
SET `actual_birth_date` = '2026-04-25'
WHERE `name` = 'Gonzalo'
  AND `birth_date` = '2026-04-25';
--> statement-breakpoint
INSERT INTO `leave_plans` (`child_id`, `owner_id`, `periods_json`, `holidays_json`, `updated_at`)
SELECT
  `id`,
  `owner_id`,
  '[{"id":"gonzalo-1","label":"Baja Común","person":"Ambos","days":42,"counting":"calendar"},{"id":"gonzalo-2","label":"Baja Marta","person":"Marta","days":91,"counting":"calendar"},{"id":"gonzalo-3","label":"Lactancia Marta","person":"Marta","days":15,"counting":"workdays"},{"id":"gonzalo-4","label":"Vacaciones Marta","person":"Marta","days":19,"counting":"workdays"},{"id":"gonzalo-5","label":"Vacaciones comunes","person":"Ambos","days":5,"counting":"workdays"},{"id":"gonzalo-6","label":"Vacaciones Dani","person":"Dani","days":8,"counting":"workdays"},{"id":"gonzalo-7","label":"Baja Dani","person":"Dani","days":140,"counting":"calendar"}]',
  '[{"date":"2026-01-01","label":"Año Nuevo"},{"date":"2026-01-06","label":"Reyes"},{"date":"2026-04-02","label":"Jueves Santo"},{"date":"2026-04-03","label":"Viernes Santo"},{"date":"2026-05-01","label":"Fiesta del Trabajo"},{"date":"2026-05-02","label":"Comunidad de Madrid"},{"date":"2026-05-15","label":"San Isidro"},{"date":"2026-08-15","label":"Asunción"},{"date":"2026-10-12","label":"Fiesta Nacional"},{"date":"2026-11-02","label":"Todos los Santos (traslado)"},{"date":"2026-11-09","label":"La Almudena"},{"date":"2026-12-07","label":"Constitución (traslado)"},{"date":"2026-12-08","label":"Inmaculada Concepción"},{"date":"2026-12-25","label":"Navidad"},{"date":"2027-01-01","label":"Año Nuevo"},{"date":"2027-01-06","label":"Reyes"},{"date":"2027-03-19","label":"San José"},{"date":"2027-03-25","label":"Jueves Santo"},{"date":"2027-03-26","label":"Viernes Santo"},{"date":"2027-05-01","label":"Fiesta del Trabajo"},{"date":"2027-05-15","label":"San Isidro"},{"date":"2027-08-16","label":"Asunción (traslado)"},{"date":"2027-10-12","label":"Fiesta Nacional"},{"date":"2027-11-01","label":"Todos los Santos"},{"date":"2027-11-09","label":"La Almudena"},{"date":"2027-12-06","label":"Constitución"},{"date":"2027-12-08","label":"Inmaculada Concepción"},{"date":"2027-12-25","label":"Navidad"}]',
  CURRENT_TIMESTAMP
FROM `children`
WHERE `name` = 'Gonzalo'
  AND `birth_date` = '2026-04-25'
ON CONFLICT(`child_id`) DO UPDATE SET
  `owner_id` = excluded.`owner_id`,
  `periods_json` = excluded.`periods_json`,
  `holidays_json` = excluded.`holidays_json`,
  `updated_at` = CURRENT_TIMESTAMP;
