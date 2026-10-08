import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { Course } from "@/lib/courses";
import { courseImageSrc, levelColors } from "./shared";

export default function CourseCard({
	course,
	onViewDetails,
}: {
	course: Course;
	onViewDetails: (course: Course) => void;
}) {
	const levelStyle = levelColors[course.level];

	return (
		<Box
			sx={{
				height: "100%",
				borderRadius: 3,
				overflow: "hidden",
				bgcolor: "#FFFFFF",
				border: course.featured ? "2px solid #4f81c3" : "1px solid #E2E8F0",
				boxShadow: course.featured
					? "0 20px 40px -15px rgba(13, 92, 143, 0.2)"
					: "0 4px 20px rgba(0,0,0,0.06)",
				transition: "all 0.3s ease",
				position: "relative",
				"&:hover": {
					transform: "translateY(-8px)",
					boxShadow: "0 25px 50px -15px rgba(0,0,0,0.15)",
				},
			}}
		>
			{course.featured && (
				<Box
					sx={{
						position: "absolute",
						top: 16,
						right: 16,
						zIndex: 2,
					}}
				>
					<Chip
						label="Recommended"
						size="small"
						sx={{
							bgcolor: "#1361af",
							color: "#FFFFFF",
							fontWeight: 600,
							fontSize: 11,
						}}
					/>
				</Box>
			)}

			<Box
				sx={{
					position: "relative",
					height: 180,
					overflow: "hidden",
				}}
			>
				<Box
					component="img"
					src={courseImageSrc(course)}
					alt={course.title}
					sx={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transition: "transform 0.3s ease",
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, transparent 30%, rgba(15, 23, 42, 0.8) 100%)",
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						bottom: 12,
						left: 12,
						right: 12,
						display: "flex",
						gap: 1,
					}}
				>
					<Chip
						label={course.level}
						size="small"
						sx={{
							bgcolor: levelStyle.bg,
							color: levelStyle.color,
							fontWeight: 600,
							fontSize: 11,
							backdropFilter: "blur(8px)",
						}}
					/>
				</Box>
			</Box>

			<Box sx={{ p: 3 }}>
				<Stack spacing={2}>
					<Typography
						variant="h4"
						sx={{
							color: "#1A1D21",
							fontSize: 20,
						}}
					>
						{course.title}
					</Typography>

					<Typography
						sx={{
							color: "#5A6370",
							fontSize: 14,
							lineHeight: 1.6,
							minHeight: 66,
						}}
					>
						{course.primaryDescription}
					</Typography>

					<Stack spacing={1}>
						<Stack direction="row" spacing={1} alignItems="center">
							<AccessTimeIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
							<Typography sx={{ color: "#5A6370", fontSize: 14 }}>
								<strong style={{ color: "#1A1D21" }}>
									{course.duration}
								</strong>{" "}
							</Typography>
						</Stack>
						<Stack direction="row" spacing={1} alignItems="center">
							<LocationOnIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
							<Typography sx={{ color: "#5A6370", fontSize: 14 }}>
								{course.venue}
							</Typography>
						</Stack>
					</Stack>

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							pt: 2,
							borderTop: "1px solid #E2E8F0",
						}}
					>
						<Box>
							<Typography
								sx={{
									fontSize: 24,
									fontWeight: 700,
									color: "#0D5C8F",
									fontFamily: "var(--font-outfit)",
								}}
							>
								{course.cost}
							</Typography>
							<Typography sx={{ fontSize: 12, color: "#94A3B8" }}>
								Course Fee
							</Typography>
						</Box>
						<Button
							variant="contained"
							endIcon={<ArrowForwardIcon />}
							onClick={() => onViewDetails(course)}
						>
							View Details
						</Button>
					</Box>
				</Stack>
			</Box>
		</Box>
	);
}
