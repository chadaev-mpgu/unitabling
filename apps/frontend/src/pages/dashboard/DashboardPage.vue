<script setup lang="ts">
import { DashboardConflicts } from './components/dashboard-conflicts';
import { DashboardMetrics } from './components/dashboard-metrics';
import { DashboardProjectSettings } from './components/dashboard-project-settings';
import { useDashboard } from './useDashboard.ts';

const {
  project,
  period,
  summary,
  sections,
  calendarOptions,
  draftName,
  draftCalendarId,
  isDirty,
  willChangeCalendar,
  canSave,
  saving,
  justSaved,
  saveError,
  save,
  reset,
} = useDashboard();
</script>

<template>
  <div data-slot="dashboard-page" class="flex min-h-0 w-full flex-1 flex-col gap-3">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-start">
      <DashboardProjectSettings
        class="xl:w-[380px] xl:shrink-0"
        :has-project="Boolean(project)"
        :name="draftName"
        :calendar-id="draftCalendarId"
        :calendars="calendarOptions"
        :period="period"
        :is-dirty="isDirty"
        :will-change-calendar="willChangeCalendar"
        :can-save="canSave"
        :saving="saving"
        :just-saved="justSaved"
        :error="saveError"
        @update:name="draftName = $event"
        @update:calendar-id="draftCalendarId = $event"
        @save="save"
        @reset="reset"
      />

      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <DashboardMetrics :sections="sections" />
        <DashboardConflicts :conflicts="summary.conflicts" />
      </div>
    </div>
  </div>
</template>
