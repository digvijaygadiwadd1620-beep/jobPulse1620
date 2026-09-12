#!/usr/bin/env python3
"""
Unit Test Suite for JobPulse Scoring and NLP Engine
Verifies tokenization, TF-IDF calculation, domain boost heuristics, and deduplication logic.
"""

import unittest
import sys
import os

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(__file__))

from jobpulse_engine import (
    tokenize,
    extract_skills_from_text,
    calculate_tfidf,
    score_job_match
)


class TestJobPulseEngine(unittest.TestCase):

    def test_tokenize_clean_and_filter_stopwords(self):
        """Verify tokenization removes punctuation and common stop words."""
        sample = "Senior QA Test Engineer with Selenium and Cypress in Pune!"
        tokens = tokenize(sample)
        self.assertIn("selenium", tokens)
        self.assertIn("cypress", tokens)
        self.assertIn("pune", tokens)
        # Verify common stop words are stripped
        self.assertNotIn("with", tokens)
        self.assertNotIn("and", tokens)
        self.assertNotIn("in", tokens)

    def test_extract_skills_from_text(self):
        """Verify canonical technical skills are accurately recognized in free text."""
        jd = (
            "Looking for a Full Stack Engineer with strong experience in "
            "React, TypeScript, Node.js, Docker, and PostgreSQL databases."
        )
        skills = extract_skills_from_text(jd)
        self.assertIn("react", skills)
        self.assertIn("typescript", skills)
        self.assertIn("node.js", skills)
        self.assertIn("docker", skills)
        self.assertIn("postgresql", skills)

    def test_tfidf_exact_and_disjoint_matches(self):
        """Verify TF-IDF returns 1.0 for identical texts and ~0.0 for disjoint texts."""
        text_a = "python pytest playwright docker automation testing regression"
        text_b = "python pytest playwright docker automation testing regression"
        text_c = "financial banking ledger accounting compliance audit taxes"

        sim_identical = calculate_tfidf(text_a, text_b)
        sim_disjoint = calculate_tfidf(text_a, text_c)

        self.assertAlmostEqual(sim_identical, 1.0, places=2)
        self.assertLess(sim_disjoint, 0.15)

    def test_score_job_match_high_alignment(self):
        """Verify candidate with matching skills and domain receives high match score (>=80%)."""
        resume_skills = ["selenium", "java", "cypress", "postman", "healthcare", "hl7", "hipaa"]
        resume_domain = "healthcare"
        resume_text = (
            "Senior QA Test Engineer with 4 years testing healthcare electronic health records, "
            "HL7, FHIR, HIPAA compliance, automated API suites in Postman and Selenium Java."
        )

        job_skills = ["selenium", "cypress", "postman", "healthcare", "hl7", "hipaa"]
        job_domain = "healthcare"
        job_text = (
            "Apex HealthTech is looking for a QA Test Engineer with expertise in Selenium, "
            "Cypress, and clinical workflow validation (HL7, FHIR, HIPAA)."
        )

        result = score_job_match(
            resume_skills=resume_skills,
            resume_domain=resume_domain,
            resume_text=resume_text,
            job_skills=job_skills,
            job_domain=job_domain,
            job_text=job_text,
            resume_title="QA Test Engineer",
            job_title="QA Test Engineer (Automation & Healthcare)"
        )

        self.assertGreaterEqual(result["total_score"], 80)
        self.assertIn("selenium", result["matched_skills"])
        self.assertIn("postman", result["matched_skills"])

    def test_score_job_match_low_alignment(self):
        """Verify candidate with misaligned domain and skills receives low match score (<50%)."""
        resume_skills = ["figma", "sketch", "ui/ux", "wireframing", "adobe xd"]
        resume_domain = "design"
        resume_text = "UI/UX Product Designer creating Figma prototypes and wireframes for mobile apps."

        job_skills = ["kubernetes", "terraform", "docker", "prometheus", "aws", "linux"]
        job_domain = "cloud_devops"
        job_text = "Senior DevOps & Kubernetes Engineer scaling hyperscale cloud infrastructure."

        result = score_job_match(
            resume_skills=resume_skills,
            resume_domain=resume_domain,
            resume_text=resume_text,
            job_skills=job_skills,
            job_domain=job_domain,
            job_text=job_text,
            resume_title="Product Designer",
            job_title="Senior Cloud DevOps & Kubernetes Engineer"
        )

        self.assertLess(result["total_score"], 50)
        self.assertEqual(len(result["matched_skills"]), 0)


if __name__ == "__main__":
    unittest.main()
