import { ResumeProfile } from "../types";

export const SAMPLE_PROFILES: ResumeProfile[] = [
  {
    id: "resume-default-01",
    name: "Digvijay Gadiwadd",
    email: "digvijaygadiwadd1620@gmail.com",
    phone: "+91 98765 43210",
    target_title: "QA Test Engineer / Automation SDET",
    domain: "healthcare",
    years_experience: 4,
    skills: [
      "selenium", "java", "cypress", "postman", "api testing", "automation testing",
      "healthcare", "hl7", "hipaa", "jira", "pytest", "python", "sql", "git"
    ],
    raw_text: `DIGVIJAY GADIWADD
QA Test Engineer | Automation SDET | Healthcare Domain Specialist
Email: digvijaygadiwadd1620@gmail.com | Location: Pune, India | Phone: +91 98765 43210

PROFESSIONAL SUMMARY:
Results-driven QA Test Engineer with 4+ years of hands-on experience designing and executing scalable automated testing suites across Web, Mobile, and REST APIs. Specialized in Healthcare IT domains including HL7, FHIR, HIPAA standards, EHR systems, and clinical patient data validation. Skilled in Selenium WebDriver, Cypress, Java, Python, Postman, and CI/CD pipelines.

CORE COMPETENCIES & TECHNICAL SKILLS:
- Test Automation: Selenium WebDriver, Cypress, Playwright, TestNG, JUnit, PyTest, Cucumber BDD
- Languages: Java, Python, JavaScript, SQL
- API Testing & Tools: Postman, REST-Assured, Swagger, JMeter, Charles Proxy
- Domain Knowledge: Healthcare IT, HIPAA Compliance, HL7 / FHIR Data Protocols, EHR/EMR Validation
- DevOps & Tools: Git, GitHub Actions, Jenkins, Docker, Jira, Confluence, TestRail

PROFESSIONAL EXPERIENCE:
Senior QA Automation Engineer | Healthcare IT Systems, Pune (2022 - Present)
- Engineered scalable automated regression test suite using Selenium Java and Cypress, reducing regression cycle time by 45%.
- Formulated API automation framework using Postman and REST-Assured for patient health records with strict HIPAA compliance.
- Validated HL7 and FHIR message exchange across hospital clinical databases.

QA Software Tester | TechSolutions Pune (2020 - 2022)
- Executed manual and automated functional, smoke, and integration testing across healthcare and enterprise applications.
- Documented 300+ high-severity defects in Jira with reproducible steps and log captures.`
  },
  {
    id: "resume-fullstack-02",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 91234 56789",
    target_title: "Full Stack Engineer (React + Node.js)",
    domain: "fullstack",
    years_experience: 5,
    skills: [
      "react", "typescript", "node.js", "express", "postgresql", "aws", "docker",
      "graphql", "next.js", "tailwind", "redis", "rest api", "git"
    ],
    raw_text: `AARAV SHARMA
Full Stack Engineer | React, TypeScript & Node.js
Location: Bengaluru, India | Email: aarav.sharma@example.com

SUMMARY:
Passionate Full Stack Engineer with 5 years building scalable web architectures, high-performance user interfaces in React/TypeScript, and microservices in Node.js/Express. Proficient with PostgreSQL, AWS cloud services, and Docker containerization.`
  },
  {
    id: "resume-devops-03",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+1 (415) 555-0199",
    target_title: "Senior Cloud DevOps & SRE Engineer",
    domain: "cloud_devops",
    years_experience: 6,
    skills: [
      "kubernetes", "docker", "terraform", "aws", "azure", "linux", "ci/cd",
      "prometheus", "grafana", "python", "go", "ansible"
    ],
    raw_text: `ELENA ROSTOVA
Senior Cloud DevOps & Site Reliability Engineer
Location: San Francisco, USA | Email: elena.rostova@example.com

SUMMARY:
Senior DevOps and SRE specialist with 6+ years orchestrating hyperscale cloud infrastructure using Kubernetes, Terraform, and AWS/Azure. Championed 99.99% uptime SLAs, zero-downtime CI/CD deployments, and proactive telemetry with Prometheus/Grafana.`
  }
];
