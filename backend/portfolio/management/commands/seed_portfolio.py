"""
Load the starting portfolio content (taken from Vishant's CV) into the database.

    python manage.py seed_portfolio           # add or update the CV content
    python manage.py seed_portfolio --reset   # wipe all content first, then load

Safe to run more than once: records are matched by a natural key and updated,
so it never creates duplicates. After the first run, edit content in the admin.
"""

from datetime import date

from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import transaction

from portfolio.models import Certification, Education, Experience, Profile, Project, Skill, SkillCategory, Stat

PROFILE = {
    "full_name": "Vishantkumar Bhavsar",
    "short_name": "Vishant",
    "headline": "Python Software Developer · Backend and full-stack · MSc Big Data Technologies",
    "summary": (
        "Python Software Developer with more than two years of experience building scalable backend "
        "services and full-stack applications using Python, Django REST Framework, FastAPI, React and "
        "PostgreSQL. Experienced in secure API development, workflow automation, data processing and "
        "cloud-native deployment using AWS, OCI, Docker, Kubernetes and CI/CD. Currently pursuing an MSc "
        "in Big Data Technologies at the University of East London, with hands-on experience in PySpark "
        "and machine-learning pipelines."
    ),
    "location": "London, UK",
    "email": "vishantbhavsar500@gmail.com",
    "linkedin_url": "https://www.linkedin.com/in/vishant810",
    "github_url": "https://github.com/vishant0815",
    "open_to_work": True,
    "availability_note": "Open to part-time roles alongside my MSc",
}

# Every number here is taken from the CV.
STATS = [
    ("Years building production software", 2, "", "+", "Jun 2023 – Jul 2025 plus internship"),
    ("Backend services engineered", 15, "", "+", "Shopno E-commerce, Django REST Framework and FastAPI"),
    ("Secure REST APIs designed", 25, "", "+", "User, order, payment and admin workflows"),
    ("Users and orders supported monthly", 5, "", "k+", "Shopno E-commerce platform"),
    ("Faster order processing", 40, "", "%", "Event-driven workflows with Kafka and Celery"),
    ("Faster API responses", 35, "", "%", "PostgreSQL indexing, query refactoring and caching"),
    ("Faster deployments", 50, "", "%", "Docker, Kubernetes and CI/CD to AWS"),
]

SKILLS = {
    "Languages": ["Python", "SQL", "JavaScript", "HTML5", "CSS3"],
    "Backend and APIs": [
        "Django", "Django REST Framework", "FastAPI", "REST APIs", "Microservices", "Celery", "WebSockets",
    ],
    "Frontend": ["React", "Next.js", "Vue", "Tailwind CSS", "Bootstrap"],
    "Data and machine learning": [
        "Pandas", "NumPy", "scikit-learn", "PyTorch", "Hugging Face Transformers", "Matplotlib", "Seaborn",
        "Requests", "BeautifulSoup", "Feature engineering", "Model evaluation",
    ],
    "Big data": [
        "Apache Spark", "PySpark", "Spark SQL", "Spark MLlib", "Apache Hadoop", "HDFS", "MapReduce", "Apache Hive",
    ],
    "Databases and messaging": ["PostgreSQL", "MySQL", "Redis", "Apache Kafka"],
    "Cloud and DevOps": [
        "AWS", "Oracle Cloud Infrastructure", "Docker", "Kubernetes", "Git", "GitHub Actions", "Jenkins", "CI/CD",
    ],
    "Engineering and security": [
        "Object-oriented programming", "Design patterns", "Agile/Scrum", "SDLC", "JWT", "OAuth2", "RBAC",
        "Data validation", "API security",
    ],
}
FEATURED_SKILLS = {
    "Python", "Django", "FastAPI", "React", "Next.js", "PostgreSQL", "AWS", "Docker", "Apache Kafka",
    "Apache Spark", "PySpark", "Apache Hadoop",
}

EXPERIENCE = [
    {
        "key": ("Python Software Developer", "Shopno E-commerce Pvt. Ltd."),
        "location": "Surat, Gujarat, India",
        "start_date": date(2023, 6, 1),
        "end_date": date(2025, 7, 1),
        "highlights": [
            "Engineered and maintained 15+ scalable Python backend services using Django REST Framework and FastAPI, supporting 5,000+ users and orders per month.",
            "Designed 25+ secure REST APIs for user, order, payment and administrative workflows, reducing integration time by 30% and enabling consistent data exchange across services.",
            "Built asynchronous, event-driven workflows using Kafka and Celery for order processing, notifications and background tasks, reducing processing time by 40%.",
            "Implemented JWT/OAuth2 authentication and role-based access control across 5+ user roles, strengthening security controls for sensitive business operations.",
            "Optimised PostgreSQL queries through indexing, query refactoring and caching, reducing API response times by 35% and improving database performance by 30%.",
            "Integrated Python APIs with React and Next.js frontends, delivering 20+ production features across the e-commerce platform.",
            "Containerised services using Docker and Kubernetes and automated AWS deployments through CI/CD pipelines, reducing deployment time by 50% and supporting 4+ releases per month.",
        ],
        "skills": [
            "Python", "Django REST Framework", "FastAPI", "Apache Kafka", "Celery", "JWT", "OAuth2", "RBAC",
            "PostgreSQL", "React", "Next.js", "Docker", "Kubernetes", "AWS", "CI/CD",
        ],
    },
    {
        "key": ("Junior Software Developer Intern", "Agile Infoways Pvt. Ltd."),
        "location": "Ahmedabad, India",
        "start_date": date(2023, 1, 1),
        "end_date": date(2023, 4, 1),
        "highlights": [
            "Delivered 10+ backend features and REST API endpoints using Python, Django and Django REST Framework, applying object-oriented programming and modular design principles.",
            "Improved PostgreSQL schema design and optimised database queries, reducing execution time by 20% for selected operations.",
            "Contributed to 6+ Agile sprints, code reviews and technical planning sessions while collaborating with a five-developer engineering team.",
        ],
        "skills": ["Python", "Django", "Django REST Framework", "PostgreSQL", "Object-oriented programming", "Agile/Scrum"],
    },
]

PROJECTS = [
    {
        "slug": "big-data-email-classification",
        "title": "Big data email classification and model evaluation",
        "tagline": "End-to-end PySpark machine-learning pipeline for email spam classification.",
        "highlights": [
            "Built an end-to-end PySpark machine-learning pipeline covering data preprocessing, feature assembly and scalable model training.",
            "Applied Chi-Square feature selection to identify 50 relevant predictive features and reduce unnecessary input dimensions.",
            "Trained and compared three Naive Bayes classification models using a consistent training and testing workflow.",
            "Evaluated models with accuracy, precision, recall, F1-score, AUROC, confusion matrices, ROC curves and precision–recall curves.",
        ],
        "skills": ["Python", "Apache Spark", "PySpark", "Spark MLlib", "Feature engineering", "Model evaluation"],
        "is_featured": True,
        "is_visible": True,
    },
    {
        "slug": "cloud-native-assignment-platform",
        "title": "Cloud-native university assignment platform",
        "tagline": "Highly available AWS architecture for an online assignment-submission system.",
        "highlights": [
            "Designed a highly available AWS architecture using Route 53, CloudFront, Elastic Load Balancing and EC2 Auto Scaling.",
            "Designed to target 99.9% availability and support thousands of simultaneous users through horizontal scaling and traffic distribution.",
            "Used Amazon S3 for document storage, Aurora Serverless for application data and ElastiCache for frequently requested data.",
            "Defined secure VPC networking, monitoring and recovery controls using security groups, private subnets and Amazon CloudWatch.",
        ],
        "skills": ["AWS"],
        "is_featured": True,
        "is_visible": True,
    },
    {
        "slug": "hrms-portal",
        "title": "HRMS portal for a multi-shop retailer",
        "tagline": "Rota, right-to-work tracking and location-checked attendance for 8 shops and about 200 staff.",
        "description": (
            "An HR management system for a retailer with 8 off-licence shops, one owner and about 200 staff. "
            "Each shop manager builds their own rota, staff see their own shifts, and the owner sees every shop. "
            "It records each employee's right-to-work and visa status, checks where staff clock in from, and "
            "routes shift swaps and cover at other shops through manager approval."
        ),
        "status": "in_progress",
        "repo_url": "https://github.com/vishant0815/hrms_nisa_local",
        "highlights": [
            "Rotas built by each shop manager, with an owner view across all 8 shops.",
            "Right-to-work and visa status tracking for every employee.",
            "Clock-in location checks, with out-of-area records flagged for manager review.",
            "Cross-shop cover shifts and shift swaps with manager approval workflows.",
        ],
        "skills": ["Django", "Django REST Framework", "FastAPI", "Apache Kafka", "Docker", "Kubernetes", "PostgreSQL"],
        "is_featured": True,
        "is_visible": True,
    },
]

EDUCATION = [
    {
        "key": ("MSc Big Data Technologies", "University of East London"),
        "start_date": date(2026, 1, 1),
        "end_date": date(2027, 5, 1),
        "is_expected": True,
        "highlights": [
            "Machine learning on big data, scalable data processing, cloud platforms and big-data systems.",
            "Developed PySpark ML pipelines covering preprocessing, feature selection, classification and model evaluation.",
        ],
    },
    {
        "key": ("Bachelor of Engineering in Computer Engineering", "Gujarat Technological University"),
        "start_date": date(2019, 1, 1),
        "end_date": date(2024, 1, 1),
        "show_years_only": True,
        "grade": "CGPA 7.36/10",
        "highlights": ["Advanced Python, Machine Learning, Big Data and Advanced Java."],
    },
]

CERTIFICATIONS = [
    {
        "name": "Oracle Cloud Infrastructure (OCI) Certified Developer Professional",
        "issuer": "Oracle",
        "issued_on": date(2025, 8, 1),
    },
]


class Command(BaseCommand):
    help = "Load the starting portfolio content from the CV. Safe to re-run."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete all portfolio content before loading.")

    @transaction.atomic
    def handle(self, *args, reset: bool = False, **options):
        if reset:
            for model in (Project, Experience, Skill, SkillCategory, Stat, Education, Certification, Profile):
                model.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing portfolio content deleted."))

        profile = Profile.objects.first()
        if profile:
            for field, value in PROFILE.items():
                setattr(profile, field, value)
            profile.save()
        else:
            Profile.objects.create(**PROFILE)

        for order, (label, value, prefix, suffix, context) in enumerate(STATS):
            Stat.objects.update_or_create(
                label=label,
                defaults={"value": value, "prefix": prefix, "suffix": suffix, "context": context, "order": order},
            )

        skills: dict[str, Skill] = {}
        for cat_order, (category_name, names) in enumerate(SKILLS.items()):
            category, _ = SkillCategory.objects.update_or_create(
                slug=_slugify(category_name), defaults={"name": category_name, "order": cat_order}
            )
            for skill_order, name in enumerate(names):
                # Match on name across all areas, so a skill moved to another area is moved
                # (keeping its links to jobs and projects) rather than duplicated.
                skill = Skill.objects.filter(name=name).first() or Skill(name=name)
                skill.category = category
                skill.order = skill_order
                skill.is_featured = name in FEATURED_SKILLS
                skill.save()
                skills[name] = skill

        for order, item in enumerate(EXPERIENCE):
            role, company = item["key"]
            experience, _ = Experience.objects.update_or_create(
                role=role,
                company=company,
                defaults={
                    "location": item["location"],
                    "start_date": item["start_date"],
                    "end_date": item["end_date"],
                    "highlights": "\n".join(item["highlights"]),
                    "order": order,
                },
            )
            experience.skills.set(skills[name] for name in item["skills"])

        for order, item in enumerate(PROJECTS):
            project, _ = Project.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "tagline": item["tagline"],
                    "description": item.get("description", ""),
                    "status": item.get("status", Project.Status.COMPLETED),
                    "repo_url": item.get("repo_url", ""),
                    "live_url": item.get("live_url", ""),
                    "highlights": "\n".join(item["highlights"]),
                    "is_featured": item["is_featured"],
                    "is_visible": item["is_visible"],
                    "order": order,
                },
            )
            project.skills.set(skills[name] for name in item["skills"])

        for order, item in enumerate(EDUCATION):
            qualification, institution = item["key"]
            Education.objects.update_or_create(
                qualification=qualification,
                institution=institution,
                defaults={
                    "start_date": item["start_date"],
                    "end_date": item["end_date"],
                    "is_expected": item.get("is_expected", False),
                    "show_years_only": item.get("show_years_only", False),
                    "grade": item.get("grade", ""),
                    "highlights": "\n".join(item["highlights"]),
                    "order": order,
                },
            )

        for order, item in enumerate(CERTIFICATIONS):
            Certification.objects.update_or_create(
                name=item["name"], defaults={"issuer": item["issuer"], "issued_on": item["issued_on"], "order": order}
            )

        cache.clear()
        self.stdout.write(
            self.style.SUCCESS(
                f"Portfolio loaded: {Stat.objects.count()} stats, {Skill.objects.count()} skills, "
                f"{Experience.objects.count()} roles, {Project.objects.count()} projects, "
                f"{Education.objects.count()} qualifications, {Certification.objects.count()} certifications."
            )
        )


def _slugify(text: str) -> str:
    from django.utils.text import slugify

    return slugify(text)
