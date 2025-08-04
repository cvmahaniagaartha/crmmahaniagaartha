/*
  # Clean Dummy Data and Setup Real Database

  1. Data Cleanup
    - Remove all dummy/sample data from existing tables
    - Keep table structure intact
    - Reset auto-increment sequences

  2. Real-time Setup
    - Enable real-time replication for all tables
    - Configure proper real-time policies

  3. Fresh Start
    - Database ready for real production data
    - All dummy data removed
*/

-- Clean all existing dummy data
DELETE FROM notes;
DELETE FROM handle_customer_data;
DELETE FROM leads;
DELETE FROM targets;
DELETE FROM packages;
DELETE FROM products;
DELETE FROM users;

-- Reset sequences (if any)
-- Note: UUID doesn't need sequence reset, but good practice for future

-- Keep only one super admin user for initial setup
INSERT INTO users (id, username, nama_lengkap, role, nomor_wa, aktif, avatar) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'Super Admin', 'superadmin', '6281234567890', true, 'https://i.pravatar.cc/150?u=admin')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  nama_lengkap = EXCLUDED.nama_lengkap,
  role = EXCLUDED.role,
  nomor_wa = EXCLUDED.nomor_wa,
  aktif = EXCLUDED.aktif,
  avatar = EXCLUDED.avatar;

-- Enable real-time replication for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE packages;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE targets;
ALTER PUBLICATION supabase_realtime ADD TABLE handle_customer_data;

-- Create real-time policies for better performance
-- Users real-time policy
DROP POLICY IF EXISTS "Enable real-time for users" ON users;
CREATE POLICY "Enable real-time for users" ON users
  FOR SELECT USING (true);

-- Products real-time policy  
DROP POLICY IF EXISTS "Enable real-time for products" ON products;
CREATE POLICY "Enable real-time for products" ON products
  FOR SELECT USING (true);

-- Packages real-time policy
DROP POLICY IF EXISTS "Enable real-time for packages" ON packages;
CREATE POLICY "Enable real-time for packages" ON packages
  FOR SELECT USING (true);

-- Leads real-time policy
DROP POLICY IF EXISTS "Enable real-time for leads" ON leads;
CREATE POLICY "Enable real-time for leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        role = 'superadmin' OR 
        (role = 'admin' AND id = leads.assigned_to) OR
        role = 'hc'
      )
    )
  );

-- Notes real-time policy
DROP POLICY IF EXISTS "Enable real-time for notes" ON notes;
CREATE POLICY "Enable real-time for notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN users u ON u.id = auth.uid()
      WHERE l.id = notes.lead_id
      AND (
        u.role = 'superadmin' OR 
        (u.role = 'admin' AND u.id = l.assigned_to) OR
        u.role = 'hc'
      )
    )
  );

-- Targets real-time policy
DROP POLICY IF EXISTS "Enable real-time for targets" ON targets;
CREATE POLICY "Enable real-time for targets" ON targets
  FOR SELECT USING (true);

-- Handle customer data real-time policy
DROP POLICY IF EXISTS "Enable real-time for handle_customer_data" ON handle_customer_data;
CREATE POLICY "Enable real-time for handle_customer_data" ON handle_customer_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'hc')
    )
  );