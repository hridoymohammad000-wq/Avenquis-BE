-- Phase 5: Enable RLS on CA Student Management Tables

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_student_profiles ON student_profiles
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_student_training_records ON student_training_records
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_student_leave_records ON student_leave_records
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_student_exam_records ON student_exam_records
  FOR ALL USING (tenant_id = app.current_tenant_id());

CREATE POLICY tenant_isolation_student_assignment_history ON student_assignment_history
  FOR ALL USING (tenant_id = app.current_tenant_id());
