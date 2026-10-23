"""
Content models for the portfolio.

Everything the website shows lives here and is edited through the Django admin,
so the site can be updated without touching code. Bullet-point fields are plain
text with one point per line, which keeps admin editing simple; the API returns
them as lists.
"""

from django.core.exceptions import ValidationError
from django.db import models


def split_lines(text: str) -> list[str]:
    return [line.strip().lstrip("-•* ").strip() for line in text.splitlines() if line.strip()]


class Ordered(models.Model):
    order = models.PositiveIntegerField(default=0, help_text="Lower numbers show first.")
    is_visible = models.BooleanField(default=True, help_text="Untick to hide from the public site.")

    class Meta:
        abstract = True
        ordering = ["order", "id"]


class Profile(models.Model):
    """The single 'about me' record. Only one row is allowed."""

    full_name = models.CharField(max_length=120)
    short_name = models.CharField(max_length=60, blank=True, help_text="Name used in greetings, e.g. Vishant.")
    headline = models.CharField(max_length=160)
    summary = models.TextField()
    location = models.CharField(max_length=120, blank=True)
    email = models.EmailField(blank=True, help_text="Shown publicly on the site.")
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    cv_url = models.URLField(blank=True, help_text="Link to a downloadable CV (PDF).")
    open_to_work = models.BooleanField(default=True)
    availability_note = models.CharField(max_length=160, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "profile"
        verbose_name_plural = "profile"

    def __str__(self) -> str:
        return self.full_name

    def clean(self) -> None:
        if not self.pk and Profile.objects.exists():
            raise ValidationError("Only one profile is allowed. Edit the existing one instead.")


class Stat(Ordered):
    """Headline numbers for the dashboard tiles, e.g. '25+ REST APIs designed'."""

    label = models.CharField(max_length=80)
    value = models.DecimalField(max_digits=10, decimal_places=1)
    prefix = models.CharField(max_length=8, blank=True)
    suffix = models.CharField(max_length=8, blank=True, help_text="e.g. +, %, k")
    context = models.CharField(max_length=160, blank=True, help_text="Where the number comes from.")

    class Meta(Ordered.Meta):
        pass

    def __str__(self) -> str:
        return f"{self.prefix}{self.value:g}{self.suffix} {self.label}"


class SkillCategory(Ordered):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta(Ordered.Meta):
        verbose_name_plural = "skill categories"

    def __str__(self) -> str:
        return self.name


class Skill(Ordered):
    category = models.ForeignKey(SkillCategory, on_delete=models.CASCADE, related_name="skills")
    name = models.CharField(max_length=60)
    level = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text="Optional self-rating from 1 to 5. Leave blank to hide the rating.",
    )
    is_featured = models.BooleanField(default=False)

    class Meta(Ordered.Meta):
        constraints = [models.UniqueConstraint(fields=["category", "name"], name="unique_skill_per_category")]

    def __str__(self) -> str:
        return self.name


class Experience(Ordered):
    role = models.CharField(max_length=120)
    company = models.CharField(max_length=120)
    location = models.CharField(max_length=120, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Leave blank if this is your current role.")
    summary = models.TextField(blank=True)
    highlights = models.TextField(blank=True, help_text="One achievement per line.")
    skills = models.ManyToManyField(Skill, blank=True, related_name="experiences")

    class Meta(Ordered.Meta):
        ordering = ["order", "-start_date"]

    def __str__(self) -> str:
        return f"{self.role} at {self.company}"

    @property
    def highlight_list(self) -> list[str]:
        return split_lines(self.highlights)

    def clean(self) -> None:
        if self.end_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date can't be before the start date."})


class Project(Ordered):
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    tagline = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    highlights = models.TextField(blank=True, help_text="One point per line.")
    skills = models.ManyToManyField(Skill, blank=True, related_name="projects")
    repo_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    image_url = models.URLField(blank=True, help_text="Screenshot or cover image URL.")
    is_featured = models.BooleanField(default=False)

    class Meta(Ordered.Meta):
        pass

    def __str__(self) -> str:
        return self.title

    @property
    def highlight_list(self) -> list[str]:
        return split_lines(self.highlights)


class Education(Ordered):
    qualification = models.CharField(max_length=160)
    institution = models.CharField(max_length=160)
    start_date = models.DateField(help_text="Shown as month and year on the site.")
    end_date = models.DateField(null=True, blank=True, help_text="Shown as month and year on the site.")
    show_years_only = models.BooleanField(default=False, help_text="Tick to show just the years, e.g. 2019 – 2024.")
    is_expected = models.BooleanField(default=False, help_text="Tick if the end date is an expected date.")
    grade = models.CharField(max_length=60, blank=True)
    highlights = models.TextField(blank=True, help_text="One point per line.")

    class Meta(Ordered.Meta):
        verbose_name_plural = "education"
        ordering = ["order", "-start_date"]

    def __str__(self) -> str:
        return f"{self.qualification}, {self.institution}"

    @property
    def highlight_list(self) -> list[str]:
        return split_lines(self.highlights)


class Certification(Ordered):
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=120)
    issued_on = models.DateField()
    credential_url = models.URLField(blank=True)

    class Meta(Ordered.Meta):
        ordering = ["order", "-issued_on"]

    def __str__(self) -> str:
        return self.name
