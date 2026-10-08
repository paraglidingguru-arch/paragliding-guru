"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogContent,
	Grid,
	IconButton,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import type { Course } from "@/lib/courses";
import { courseImageSrc, levelColors } from "./shared";

export default function CourseDetailsDialog({
	course,
	open,
	onClose,
	onApply,
}: {
	course: Course | null;
	open: boolean;
	onClose: () => void;
	onApply: () => void;
}) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

	if (!course) return null;
	const levelStyle = levelColors[course.level];
	const sessions = course.schedule?.sessions ?? [];
	const scheduleNote = course.schedule?.note ?? "";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={fullScreen}
			scroll="paper"
			slotProps={{
				paper: {
					sx: {
						borderRadius: { xs: 0, sm: 3 },
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					},
				},
			}}
		>
			<Box
				sx={{
					position: "relative",
					height: { xs: 180, md: 220 },
					overflow: "hidden",
					flexShrink: 0,
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
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						background:
							"linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)",
					}}
				/>
				<IconButton
					onClick={onClose}
					aria-label="Close"
					sx={{
						position: "absolute",
						top: 12,
						right: 12,
						bgcolor: "rgba(255,255,255,0.95)",
						color: "#1A1D21",
						"&:hover": { bgcolor: "#FFFFFF" },
					}}
				>
					<CloseIcon />
				</IconButton>
				<Box
					sx={{
						position: "absolute",
						bottom: 20,
						left: 24,
						right: 24,
					}}
				>
					<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
						<Chip
							label={course.level}
							size="small"
							sx={{
								bgcolor: levelStyle.bg,
								color: levelStyle.color,
								fontWeight: 600,
								fontSize: 11,
							}}
						/>
						{course.tag && (
							<Chip
								label={course.tag}
								size="small"
								sx={{
									bgcolor: "rgba(255,255,255,0.2)",
									color: "#FFFFFF",
									fontWeight: 600,
									fontSize: 11,
									backdropFilter: "blur(8px)",
								}}
							/>
						)}
					</Stack>
					<Typography
						variant="h3"
						sx={{
							color: "#FFFFFF",
							fontSize: { xs: 24, md: 32 },
							fontWeight: 700,
							fontFamily: "var(--font-outfit)",
						}}
					>
						{course.title}
					</Typography>
				</Box>
			</Box>

			<DialogContent sx={{ p: { xs: 3, md: 4 }, flex: 1, overflowY: "auto" }}>
				<Stack spacing={3}>
					<Typography
						sx={{
							color: "#5A6370",
							fontSize: 16,
							lineHeight: 1.7,
						}}
					>
						{course.primaryDescription}
						<br />
						{course.secondaryDescription}
						<br />
						<br />
						<span>*individual learning for each student might vary.</span>
						<br />
						<span>*prices based on number of days mentioned</span>
						<br />
						<span>*days may vary according to weather conditions</span>
					</Typography>

					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 4 }}>
							<Stack
								direction="row"
								spacing={1.5}
								alignItems="center"
								sx={{
									p: 2,
									bgcolor: "#F8FAFC",
									borderRadius: 2,
									border: "1px solid #E2E8F0",
								}}
							>
								<AccessTimeIcon sx={{ color: "#0D5C8F" }} />
								<Box>
									<Typography
										sx={{
											fontSize: 11,
											color: "#94A3B8",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											fontWeight: 600,
										}}
									>
										Duration
									</Typography>
									<Typography
										sx={{ fontSize: 15, fontWeight: 600, color: "#1A1D21" }}
									>
										{course.duration}
									</Typography>
								</Box>
							</Stack>
						</Grid>
						<Grid size={{ xs: 12, sm: 4 }}>
							<Stack
								direction="row"
								spacing={1.5}
								alignItems="center"
								sx={{
									p: 2,
									bgcolor: "#F8FAFC",
									borderRadius: 2,
									border: "1px solid #E2E8F0",
								}}
							>
								<LocationOnIcon sx={{ color: "#0D5C8F" }} />
								<Box>
									<Typography
										sx={{
											fontSize: 11,
											color: "#94A3B8",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											fontWeight: 600,
										}}
									>
										Location
									</Typography>
									<Typography
										sx={{ fontSize: 15, fontWeight: 600, color: "#1A1D21" }}
									>
										{course.venue}
									</Typography>
								</Box>
							</Stack>
						</Grid>
						<Grid size={{ xs: 12, sm: 4 }}>
							<Stack
								direction="row"
								spacing={1.5}
								alignItems="center"
								sx={{
									p: 2,
									bgcolor: "rgba(13, 92, 143, 0.06)",
									borderRadius: 2,
									border: "1px solid rgba(13, 92, 143, 0.15)",
								}}
							>
								<Box>
									<Typography
										sx={{
											fontSize: 11,
											color: "#94A3B8",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											fontWeight: 600,
										}}
									>
										Cost
									</Typography>
									<Typography
										sx={{
											fontSize: 18,
											fontWeight: 700,
											color: "#0D5C8F",
											fontFamily: "var(--font-outfit)",
										}}
									>
										{course.cost}
									</Typography>
								</Box>
							</Stack>
						</Grid>
					</Grid>

					<Box>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{ mb: 1.5 }}
						>
							<EventIcon sx={{ color: "#0D5C8F", fontSize: 22 }} />
							<Typography
								variant="h5"
								sx={{
									color: "#1A1D21",
									fontSize: 18,
									fontWeight: 700,
								}}
							>
								Upcoming Dates
							</Typography>
						</Stack>
						{scheduleNote && (
							<Typography
								sx={{
									color: "#5A6370",
									fontSize: 14,
									mb: sessions.length > 0 ? 1.5 : 0,
									fontStyle: "italic",
								}}
							>
								{scheduleNote}
							</Typography>
						)}
						{sessions.length > 0 && (
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								{sessions.map((session) => (
									<Chip
										key={session}
										label={session}
										sx={{
											bgcolor: "#FFFFFF",
											border: "1px solid #E2E8F0",
											color: "#1A1D21",
											fontWeight: 500,
											fontSize: 13,
										}}
									/>
								))}
							</Stack>
						)}
						{sessions.length === 0 && (
							<Typography sx={{ color: "#5A6370", fontSize: 14 }}>
								Contact us to know more about the upcoming dates.
							</Typography>
						)}
					</Box>

					<Box
						sx={{
							pt: 2,
							borderTop: "1px solid #E2E8F0",
							display: "flex",
							justifyContent: "flex-end",
							gap: 2,
						}}
					>
						<Button
							variant="text"
							onClick={onClose}
							sx={{ color: "#5A6370", textTransform: "none" }}
						>
							Close
						</Button>
						<Button
							variant="contained"
							size="large"
							onClick={onApply}
							sx={{
								px: 4,
								py: 1.25,
								textTransform: "none",
								fontWeight: 600,
							}}
						>
							Apply Now
						</Button>
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
