<script setup>
import { ref } from "vue";
import EditableText from "./EditableText.vue";

defineProps({
  resume: {
    type: Object,
    required: true,
  },
  basicInfo: {
    type: Object,
    required: true,
  },
  infoLines: {
    type: Array,
    required: true,
  },
  loadingSections: {
    type: Object,
    default: () => ({
      skills: false,
      campus: false,
      projects: false,
    }),
  },
  photoSrc: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update-basic-info",
  "update-campus",
  "update-info-line",
  "update-project",
  "update-project-action",
  "update-project-label",
  "update-section-title",
  "update-skill",
]);

const pageRef = ref(null);

defineExpose({
  getPageElement: () => pageRef.value,
});
</script>

<template>
  <section class="resume-pane" aria-label="生成简历预览">
    <div class="resume-scroll">
      <article ref="pageRef" class="resume-page">
        <header class="resume-header">
          <div>
            <EditableText
              tag="h2"
              class="resume-name"
              :model-value="basicInfo.name"
              @update:model-value="emit('update-basic-info', 'name', $event)"
            />
            <div class="resume-info">
              <EditableText
                v-for="(line, index) in infoLines"
                :key="index"
                tag="p"
                :model-value="line"
                @update:model-value="emit('update-info-line', index, $event)"
              />
              <p class="resume-target">
                <EditableText
                  tag="span"
                  :model-value="resume.sectionTitles.intentPrefix"
                  @update:model-value="emit('update-section-title', 'intentPrefix', $event)"
                />
                <EditableText
                  tag="span"
                  :model-value="basicInfo.intent"
                  @update:model-value="emit('update-basic-info', 'intent', $event)"
                />
              </p>
            </div>
          </div>
          <div class="resume-photo">
            <img v-if="photoSrc" :src="photoSrc" alt="个人照片" />
            <span v-else>照片</span>
          </div>
        </header>

        <section v-if="loadingSections.skills || resume.skills.length" class="paper-section">
          <EditableText
            tag="h3"
            class="paper-title"
            :model-value="resume.sectionTitles.skills"
            @update:model-value="emit('update-section-title', 'skills', $event)"
          />
          <div v-if="loadingSections.skills" class="section-skeleton">
            <span class="skeleton-line long"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-line medium"></span>
            <span class="skeleton-line"></span>
          </div>
          <div v-else class="skill-stack">
            <EditableText
              v-for="(skill, index) in resume.skills"
              :key="index"
              tag="p"
              :model-value="skill"
              @update:model-value="emit('update-skill', index, $event)"
            />
          </div>
        </section>

        <section v-if="loadingSections.campus || resume.campus.title || resume.campus.body" class="paper-section">
          <EditableText
            tag="h3"
            class="paper-title"
            :model-value="resume.sectionTitles.campus"
            @update:model-value="emit('update-section-title', 'campus', $event)"
          />
          <div v-if="loadingSections.campus" class="section-skeleton compact">
            <span class="skeleton-line short"></span>
            <span class="skeleton-line long"></span>
            <span class="skeleton-line medium"></span>
          </div>
          <div v-else class="campus-card">
            <EditableText
              tag="strong"
              :model-value="resume.campus.title"
              @update:model-value="emit('update-campus', 'title', $event)"
            />
            <EditableText
              tag="p"
              :model-value="resume.campus.body"
              @update:model-value="emit('update-campus', 'body', $event)"
            />
          </div>
        </section>

        <section v-if="loadingSections.projects || resume.projects.length" class="paper-section">
          <EditableText
            tag="h3"
            class="paper-title"
            :model-value="resume.sectionTitles.projects"
            @update:model-value="emit('update-section-title', 'projects', $event)"
          />
          <div v-if="loadingSections.projects" class="section-skeleton project-skeleton">
            <span class="skeleton-line medium"></span>
            <span class="skeleton-line long"></span>
            <span class="skeleton-line"></span>
            <span class="skeleton-line long"></span>
            <span class="skeleton-line short"></span>
          </div>
          <template v-else>
            <article v-for="(project, index) in resume.projects" :key="index" class="project">
              <div class="project-head">
                <div>
                  <EditableText
                    tag="strong"
                    class="project-name"
                    :model-value="project.name"
                    @update:model-value="emit('update-project', { index, key: 'name', value: $event })"
                  />
                  <EditableText
                    tag="span"
                    class="project-role"
                    :model-value="project.role"
                    @update:model-value="emit('update-project', { index, key: 'role', value: $event })"
                  />
                </div>
                <EditableText
                  tag="span"
                  class="project-time"
                  :model-value="project.time"
                  @update:model-value="emit('update-project', { index, key: 'time', value: $event })"
                />
              </div>

              <p class="project-block">
                <EditableText
                  tag="strong"
                  :model-value="resume.projectLabels.background"
                  @update:model-value="emit('update-project-label', 'background', $event)"
                />
                <EditableText
                  tag="span"
                  :model-value="project.background"
                  @update:model-value="emit('update-project', { index, key: 'background', value: $event })"
                />
              </p>
              <p class="project-block">
                <EditableText
                  tag="strong"
                  :model-value="resume.projectLabels.challenge"
                  @update:model-value="emit('update-project-label', 'challenge', $event)"
                />
                <EditableText
                  tag="span"
                  :model-value="project.challenge"
                  @update:model-value="emit('update-project', { index, key: 'challenge', value: $event })"
                />
              </p>
              <div class="project-block">
                <EditableText
                  tag="strong"
                  :model-value="resume.projectLabels.actions"
                  @update:model-value="emit('update-project-label', 'actions', $event)"
                />
                <ul>
                  <li v-for="(action, actionIndex) in project.actions" :key="actionIndex">
                    <EditableText
                      tag="span"
                      :model-value="action"
                      @update:model-value="emit('update-project-action', { projectIndex: index, actionIndex, value: $event })"
                    />
                  </li>
                </ul>
              </div>
              <p class="project-block">
                <EditableText
                  tag="strong"
                  :model-value="resume.projectLabels.stack"
                  @update:model-value="emit('update-project-label', 'stack', $event)"
                />
                <EditableText
                  tag="span"
                  class="keywords"
                  :model-value="project.stack"
                  @update:model-value="emit('update-project', { index, key: 'stack', value: $event })"
                />
              </p>
            </article>
          </template>
        </section>
      </article>
    </div>
  </section>
</template>
