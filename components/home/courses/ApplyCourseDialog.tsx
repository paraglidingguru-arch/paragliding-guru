"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
	Box,
	Button,
	Dialog,
	DialogContent,
	IconButton,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { useState } from "react";
import { type Course, usesSivForm } from "@/lib/courses";
import SivApplicationForm from "./SivApplicationForm";
import StandardApplicationForm from "./StandardApplicationForm";

/**
 * Dialog shell shared by both application forms. The form inside unmounts when
 * the dialog closes, so reopening it always starts from an empty form.
 */
export default function ApplyCourseDialog({
	course,
	open,
	onClose,
	onBack,
}: {
	course: Course | null;
	open: boolean;
	onClose: () => void;
	onBack: () => void;
}) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
	const [submitted, setSubmitted] = useState(false);

	if (!course) return null;

	const siv = usesSivForm(course);

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
						display: "flex",
						flexDirection: "column",
					},
				},
				transition: {
					onExited: () => setSubmitted(false),
				},
			}}
		>
			<Box
				sx={{
					position: "relative",
					px: { xs: 3, md: 4 },
					pt: { xs: 3, md: 4 },
					pb: 2,
					background:
						"linear-gradient(135deg, rgba(13, 92, 143, 0.06) 0%, rgba(19, 97, 175, 0.06) 100%)",
					borderBottom: "1px solid #E2E8F0",
					flexShrink: 0,
				}}
			>
				<IconButton
					onClick={onClose}
					aria-label="Close"
					sx={{
						position: "absolute",
						top: 12,
						right: 12,
						color: "#5A6370",
					}}
				>
					<CloseIcon />
				</IconButton>
				<Typography
					sx={{
						fontSize: 12,
						color: "#0D5C8F",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						fontWeight: 700,
						mb: 0.5,
					}}
				>
					Apply for
				</Typography>
				<Typography
					variant="h4"
					sx={{
						color: "#1A1D21",
						fontSize: { xs: 22, md: 26 },
						fontWeight: 700,
						fontFamily: "var(--font-outfit)",
					}}
				>
					{course.title}
				</Typography>
			</Box>

			<DialogContent sx={{ p: { xs: 3, md: 4 }, flex: 1, overflowY: "auto" }}>
				{submitted ? (
					<Stack
						spacing={2}
						alignItems="center"
						sx={{ py: 4, textAlign: "center" }}
					>
						<Typography variant="h5" sx={{ color: "#0a5b2f", fontWeight: 700 }}>
							Application received!
						</Typography>
						<Typography sx={{ color: "#5A6370", maxWidth: 420 }}>
							Thanks for applying to {course.title}. We&apos;ve received your
							details and will get back to you within 24 hours to confirm the
							next steps.
						</Typography>
						<Button
							variant="contained"
							onClick={onClose}
							sx={{ mt: 2, textTransform: "none" }}
						>
							Close
						</Button>
					</Stack>
				) : siv ? (
					<SivApplicationForm
						course={course}
						onSubmitted={() => setSubmitted(true)}
						onBack={onBack}
					/>
				) : (
					<StandardApplicationForm
						course={course}
						onSubmitted={() => setSubmitted(true)}
						onBack={onBack}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
