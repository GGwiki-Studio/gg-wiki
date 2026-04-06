'use client'

import { client } from '@/api/client'
import { createDefaultProject } from '@/components/builder/builder.utils'
import { deleteProjectAssets } from '@/lib/storage/project-storage'
import type { BuilderProject } from '@/components/builder/builder.types'

export interface ProjectListItem {
  id: string
  title: string
  schemaVersion: number
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectRow {
  id: string
  userId: string
  title: string
  projectData: BuilderProject
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

interface ActionResult<T> {
  data: T | null
  error: string | null
}


function toProjectListItem(row: Record<string, unknown>): ProjectListItem {
  return {
    id: row.id as string,
    title: row.title as string,
    schemaVersion: row.schema_version as number,
    thumbnailUrl: (row.thumbnail_url as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function toProjectRow(row: Record<string, unknown>): ProjectRow {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    projectData: row.project_data as BuilderProject,
    schemaVersion: row.schema_version as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function createProject(
  userId: string,
  title: string
): Promise<ActionResult<ProjectListItem>> {
  const defaultProject = createDefaultProject({ title })

  const { data, error } = await client
    .from('projects')
    .insert({
      user_id: userId,
      title,
      project_data: defaultProject,
      schema_version: 1,
    })
    .select('id, title, schema_version, created_at, updated_at, thumbnail_url')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toProjectListItem(data), error: null }
}

export async function getUserProjects(
  userId: string
): Promise<ActionResult<ProjectListItem[]>> {
  const { data, error } = await client
    .from('projects')
    .select('id, title, schema_version, created_at, updated_at, thumbnail_url')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data || []).map(toProjectListItem), error: null }
}

export async function getProject(
  projectId: string,
  userId: string
): Promise<ActionResult<ProjectRow>> {
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toProjectRow(data), error: null }
}

export async function renameProject(
  projectId: string,
  userId: string,
  newTitle: string
): Promise<ActionResult<ProjectListItem>> {
  const { data, error } = await client
    .from('projects')
    .update({
      title: newTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('id, title, schema_version, created_at, updated_at, thumbnail_url')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toProjectListItem(data), error: null }
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<ActionResult<{ id: string }>> {
  await deleteProjectAssets(userId, projectId)

  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: { id: projectId }, error: null }
}

export async function saveProject(
  projectId: string,
  userId: string,
  projectData: BuilderProject,
  schemaVersion: number,
  thumbnailUrl?: string | null
): Promise<ActionResult<ProjectListItem>> {
  const updatePayload: Record<string, unknown> = {
    project_data: projectData,
    schema_version: schemaVersion,
    title: projectData.title,
    updated_at: new Date().toISOString(),
  }
  if (thumbnailUrl) {
    updatePayload.thumbnail_url = thumbnailUrl
  }

  const { data, error } = await client
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('id, title, schema_version, created_at, updated_at, thumbnail_url')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: toProjectListItem(data), error: null }
}