from rest_framework import serializers

from .models import Certification, Education, Experience, Profile, Project, Skill, SkillCategory, Stat


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "full_name", "short_name", "headline", "summary", "location", "email",
            "linkedin_url", "github_url", "cv_url", "open_to_work", "availability_note", "updated_at",
        ]


class StatSerializer(serializers.ModelSerializer):
    value = serializers.FloatField()

    class Meta:
        model = Stat
        fields = ["id", "label", "value", "prefix", "suffix", "context"]


class SkillSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Skill
        fields = ["id", "name", "category", "level", "is_featured"]


class SkillCategorySerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ["id", "name", "slug", "skills"]

    def get_skills(self, obj: SkillCategory) -> list[dict]:
        visible = [s for s in obj.skills.all() if s.is_visible]
        return SkillSerializer(visible, many=True).data


class SkillNameField(serializers.RelatedField):
    def to_representation(self, value: Skill) -> str:
        return value.name


class ExperienceSerializer(serializers.ModelSerializer):
    highlights = serializers.ListField(source="highlight_list", child=serializers.CharField(), read_only=True)
    skills = SkillNameField(many=True, read_only=True)
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = Experience
        fields = [
            "id", "role", "company", "location", "start_date", "end_date",
            "is_current", "summary", "highlights", "skills",
        ]

    def get_is_current(self, obj: Experience) -> bool:
        return obj.end_date is None


class ProjectSerializer(serializers.ModelSerializer):
    highlights = serializers.ListField(source="highlight_list", child=serializers.CharField(), read_only=True)
    skills = SkillNameField(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "title", "slug", "tagline", "description", "highlights", "skills",
            "repo_url", "live_url", "image_url", "is_featured",
        ]


class EducationSerializer(serializers.ModelSerializer):
    highlights = serializers.ListField(source="highlight_list", child=serializers.CharField(), read_only=True)

    class Meta:
        model = Education
        fields = ["id", "qualification", "institution", "start_date", "end_date", "show_years_only", "is_expected", "grade", "highlights"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name", "issuer", "issued_on", "credential_url"]
