-- fix_missing_tags.sql
-- Manually fixes specialty_tags for 3 clinics whose websites could not be scraped
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)

UPDATE clinics SET specialty_tags = ARRAY['眼科', '外科', '腫瘤科', '骨科', '神經外科'] WHERE name = '汎亞動物醫院';
UPDATE clinics SET specialty_tags = ARRAY['外科', '骨科', '神經外科', '腫瘤科', '泌尿科'] WHERE name = '沐恩動物醫院';
UPDATE clinics SET specialty_tags = ARRAY['牙科', '眼科', '心臟科', '腫瘤科', '骨科', '神經外科', '泌尿科', '外科'] WHERE name = '台大動物醫院';
