-- update_websites.sql
-- Adds website URLs to the 13 original specialty clinics
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- 白牙動物醫院 is excluded — no official website found (Facebook only)

UPDATE clinics SET website = 'https://drpet.com.tw/'            WHERE name = '敦品動物醫院';
UPDATE clinics SET website = 'https://hongjivetdentistry.com/'  WHERE name = '弘吉獸醫院';
UPDATE clinics SET website = 'https://www.everbrightvet.com/'   WHERE name = '常明動物醫院';
UPDATE clinics SET website = 'https://lumi.vet/'                WHERE name = '路米動物醫院';
UPDATE clinics SET website = 'http://panasia-vet.com/'          WHERE name = '汎亞動物醫院';
UPDATE clinics SET website = 'https://www.shangqun.com.tw/'     WHERE name = '上群動物醫院';
UPDATE clinics SET website = 'https://www.oasisvets.tw/'        WHERE name = '綠洲動物醫院';
UPDATE clinics SET website = 'http://www.muanamc.tw/'           WHERE name = '沐恩動物醫院';
UPDATE clinics SET website = 'https://lovelyvetderm.wixsite.com/derm' WHERE name = '樂膚莉動物醫院';
UPDATE clinics SET website = 'https://eden-vet.com/'            WHERE name = '伊甸園動物醫院';
UPDATE clinics SET website = 'https://daan-vet.com/'            WHERE name = '大安動物醫院';
UPDATE clinics SET website = 'https://www.vh.ntu.edu.tw/'       WHERE name = '台大動物醫院';
