export type FeedbackCategory = "Excellent" | "Very Good" | "Good" | "Fair" | "Poor";

export type Feedback = {
  id: string;
  employeeId: string;
  reviewerId: string;
  score: number;
  averageScore: number;
  categoryLabel: FeedbackCategory;
  comments: string;
  date: Date;
};
