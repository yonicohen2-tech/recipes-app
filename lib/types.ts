export type DietaryTag = 'dairy' | 'non-dairy' | 'gluten-free' | 'vegan' | 'vegetarian' | 'meat'
export type CourseType = 'appetizer' | 'first-course' | 'main-course' | 'side-dish' | 'dessert' | 'drink' | 'snack'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Recipe {
  id: string
  title: string
  description: string | null
  course_type: CourseType
  dietary_tags: DietaryTag[]
  difficulty: Difficulty
  prep_time: number
  cook_time: number
  file_url: string | null
  file_type: string | null
  video_url: string | null
  added_by: string
  added_by_name: string
  created_at: string
}

export interface Comment {
  id: string
  recipe_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  email: string
}
