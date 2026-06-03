<script setup>
import { computed, ref } from "vue";
import EditableText from "./EditableText.vue";

const props = defineProps({
  resume: {
    type: Object,
    required: true,
  },
  layoutTemplate: {
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
      work: false,
      internships: false,
      awards: false,
    }),
  },
  photoSrc: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update-awards",
  "update-basic-info",
  "update-campus",
  "update-experience",
  "update-experience-action",
  "update-info-line",
  "update-project-label",
  "update-section-title",
  "update-skill",
]);

const pageRef = ref(null);
const experienceSections = computed(() =>
  [
    { key: "work", items: props.resume.work || [] },
    { key: "internships", items: props.resume.internships || [] },
    { key: "projects", items: props.resume.projects || [] },
  ].filter((section) => props.loadingSections[section.key] || section.items.length),
);

defineExpose({
  getPageElement: () => pageRef.value,
});
</script>

<template>
  <section class="resume-pane" aria-label="生成简历预览">
    <div class="resume-scroll">
      <article
        ref="pageRef"
        class="resume-page"
        :class="`layout-${layoutTemplate.layout || 'classic'}`"
        :style="{
          '--paper-blue': layoutTemplate.theme?.accentColor || '#1f4e79',
          '--paper-soft': layoutTemplate.theme?.secondaryColor || '#eef6f5',
          fontFamily: layoutTemplate.theme?.fontFamily || undefined,
        }"
      >
        <header class="resume-header">
          <div>
            <EditableText
              tag="h2"
              class="resume-name"
              :model-value="basicInfo.name"
              @update:model-value="emit('update-basic-info', 'name', $event)"
            />
            <div class="resume-info">
              <div class="resume-info-classic">
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
              <div class="resume-info-sidebar">
                <strong class="sidebar-title">个人信息</strong>
                <p>
                  <span>性别</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.gender"
                    @update:model-value="emit('update-basic-info', 'gender', $event)"
                  />
                </p>
                <p>
                  <span>手机号</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.phone"
                    @update:model-value="emit('update-basic-info', 'phone', $event)"
                  />
                </p>
                <p>
                  <span>邮箱</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.email"
                    @update:model-value="emit('update-basic-info', 'email', $event)"
                  />
                </p>
                <p>
                  <span>学校</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.schoolInfo"
                    @update:model-value="emit('update-basic-info', 'schoolInfo', $event)"
                  />
                </p>
                <p>
                  <span>专业</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.majorInfo"
                    @update:model-value="emit('update-basic-info', 'majorInfo', $event)"
                  />
                </p>
                <p>
                  <span>求职意向</span>
                  <EditableText
                    tag="em"
                    :model-value="basicInfo.intent"
                    @update:model-value="emit('update-basic-info', 'intent', $event)"
                  />
                </p>
              </div>
            </div>
          </div>
          <div class="resume-photo">
            <img v-if="photoSrc" :src="photoSrc" alt="个人照片" />
            <span v-else>照片</span>
          </div>
        </header>

        <div class="resume-body">
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

          <section v-for="section in experienceSections" :key="section.key" class="paper-section">
            <EditableText
              tag="h3"
              class="paper-title"
              :model-value="resume.sectionTitles[section.key]"
              @update:model-value="emit('update-section-title', section.key, $event)"
            />
            <div v-if="loadingSections[section.key]" class="section-skeleton project-skeleton">
              <span class="skeleton-line medium"></span>
              <span class="skeleton-line long"></span>
              <span class="skeleton-line"></span>
              <span class="skeleton-line long"></span>
              <span class="skeleton-line short"></span>
            </div>
            <template v-else>
              <article v-for="(item, index) in section.items" :key="index" class="project">
                <div class="project-head">
                  <div>
                    <EditableText
                      tag="strong"
                      class="project-name"
                      :model-value="item.name"
                      @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'name', value: $event })"
                    />
                    <EditableText
                      tag="span"
                      class="project-role"
                      :model-value="item.role"
                      @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'role', value: $event })"
                    />
                  </div>
                  <EditableText
                    tag="span"
                    class="project-time"
                    :model-value="item.time"
                    @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'time', value: $event })"
                  />
                </div>

                <p v-if="item.background" class="project-summary">
                  <EditableText
                    tag="span"
                    class="project-label"
                    :model-value="resume.projectLabels.background"
                    @update:model-value="emit('update-project-label', 'background', $event)"
                  />
                  <EditableText
                    tag="span"
                    :model-value="item.background"
                    @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'background', value: $event })"
                  />
                </p>
                <p v-if="item.challenge" class="project-summary">
                  <EditableText
                    tag="span"
                    class="project-label"
                    :model-value="resume.projectLabels.challenge"
                    @update:model-value="emit('update-project-label', 'challenge', $event)"
                  />
                  <EditableText
                    tag="span"
                    :model-value="item.challenge"
                    @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'challenge', value: $event })"
                  />
                </p>
                <div v-if="item.actions?.length" class="project-actions">
                  <EditableText
                    tag="span"
                    class="project-label"
                    :model-value="resume.projectLabels.actions"
                    @update:model-value="emit('update-project-label', 'actions', $event)"
                  />
                  <ul>
                    <li v-for="(action, actionIndex) in item.actions" :key="actionIndex">
                      <EditableText
                        tag="span"
                        :model-value="action"
                        @update:model-value="
                          emit('update-experience-action', {
                            sectionKey: section.key,
                            itemIndex: index,
                            actionIndex,
                            value: $event,
                          })
                        "
                      />
                    </li>
                  </ul>
                </div>
                <p v-if="item.stack" class="project-stack">
                  <EditableText
                    tag="span"
                    class="project-label"
                    :model-value="resume.projectLabels.stack"
                    @update:model-value="emit('update-project-label', 'stack', $event)"
                  />
                  <EditableText
                    tag="span"
                    class="keywords"
                    :model-value="item.stack"
                    @update:model-value="emit('update-experience', { sectionKey: section.key, index, key: 'stack', value: $event })"
                  />
                </p>
              </article>
            </template>
          </section>

          <section v-if="loadingSections.awards || resume.awards.length" class="paper-section">
            <EditableText
              tag="h3"
              class="paper-title"
              :model-value="resume.sectionTitles.awards"
              @update:model-value="emit('update-section-title', 'awards', $event)"
            />
            <div v-if="loadingSections.awards" class="section-skeleton compact">
              <span class="skeleton-line medium"></span>
              <span class="skeleton-line long"></span>
            </div>
            <EditableText
              v-else
              tag="p"
              class="award-line"
              :model-value="resume.awards.join('、')"
              @update:model-value="emit('update-awards', $event)"
            />
          </section>
        </div>
      </article>
    </div>
  </section>
</template>
