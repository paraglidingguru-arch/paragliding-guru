"use client";

import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { useState } from "react";
import coursesContent from "@/content/courses.json";
import { type Course, courses } from "@/lib/courses";
import ApplyCourseDialog from "./courses/ApplyCourseDialog";
import CourseCard from "./courses/CourseCard";
import CourseDetailsDialog from "./courses/CourseDetailsDialog";

export default function CoursesSection() {
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [applyOpen, setApplyOpen] = useState(false);

	const handleViewDetails = (course: Course) => {
		setSelectedCourse(course);
		setDetailsOpen(true);
	};

	const handleApply = () => {
		setDetailsOpen(false);
		setApplyOpen(true);
	};

	const handleBackToDetails = () => {
		setApplyOpen(false);
		setDetailsOpen(true);
	};

	return (
		<Box
			component="section"
			id="courses"
			sx={{
				position: "relative",
				bgcolor: "#F8FAFC",
				px: { xs: 2, md: 4 },
				py: { xs: 8, md: 12 },
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: 400,
					background:
						"linear-gradient(180deg, rgba(13, 92, 143, 0.03) 0%, transparent 100%)",
					pointerEvents: "none",
				}}
			/>

			<Stack
				spacing={6}
				sx={{ maxWidth: 1200, mx: "auto", position: "relative", zIndex: 1 }}
			>
				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={3}
					alignItems={{ xs: "flex-start", md: "flex-end" }}
					justifyContent="space-between"
				>
					<Box>
						<Chip
							label={coursesContent.badge}
							sx={{
								bgcolor: "rgba(13, 92, 143, 0.1)",
								color: "#0D5C8F",
								fontWeight: 600,
								fontSize: 13,
								mb: 2,
							}}
						/>
						<Typography variant="h2" sx={{ color: "#1A1D21", mb: 1 }}>
							{coursesContent.title}
						</Typography>
						<Typography sx={{ color: "#5A6370", maxWidth: 500 }}>
							{coursesContent.description}
						</Typography>
					</Box>
					{/* <Button
						variant="outlined"
						sx={{
							borderColor: "#0D5C8F",
							color: "#0D5C8F",
							borderWidth: 2,
							"&:hover": {
								borderWidth: 2,
								bgcolor: "rgba(13, 92, 143, 0.05)",
							},
						}}
					>
						View All Courses
					</Button> */}
				</Stack>

				<Grid container spacing={3}>
					{courses.map((course) => (
						<Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.title}>
							<CourseCard course={course} onViewDetails={handleViewDetails} />
						</Grid>
					))}
				</Grid>
			</Stack>

			<CourseDetailsDialog
				course={selectedCourse}
				open={detailsOpen}
				onClose={() => setDetailsOpen(false)}
				onApply={handleApply}
			/>
			<ApplyCourseDialog
				course={selectedCourse}
				open={applyOpen}
				onClose={() => setApplyOpen(false)}
				onBack={handleBackToDetails}
			/>
		</Box>
	);
}
