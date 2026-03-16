-- ABOUTME: Adds admin override to the DELETE policy on creative_studio_generations.
-- ABOUTME: Mirrors the existing SELECT and UPDATE policies which already allow admin access.

DROP POLICY "Users delete own generations" ON creative_studio_generations;

CREATE POLICY "Users delete own generations" ON creative_studio_generations
  FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
