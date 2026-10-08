"use client";

import SendIcon from "@mui/icons-material/Send";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	type SelectChangeEvent,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import type { Course } from "@/lib/courses";
import { dialogSelectMenuProps } from "./shared";

const fitnessLevels = ["Low", "Moderate", "Good", "Excellent"];
const fearHandlingOptions = [
	"I stay calm under pressure",
	"I manage fear well after some time",
	"I'm cautious but willing to push through",
	"I struggle with fear — looking to improve",
];

type ApplicationForm = {
	fullName: string;
	dob: string;
	email: string;
	phone: string;
	nationality: string;
	weight: string;
	batch: string;
	education: string;
	fitnessLevel: string;
	sportsHistory: string;
	coordinationActivities: string;
	fearHandling: string;
	motivation: string;
};

const emptyForm: ApplicationForm = {
	fullName: "",
	dob: "",
	email: "",
	phone: "",
	nationality: "",
	weight: "",
	batch: "",
	education: "",
	fitnessLevel: "",
	sportsHistory: "",
	coordinationActivities: "",
	fearHandling: "",
	motivation: "",
};

type FormErrors = Partial<Record<keyof ApplicationForm, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateApplicationForm(form: ApplicationForm): FormErrors {
	const errors: FormErrors = {};

	const fullName = form.fullName.trim();
	if (!fullName) {
		errors.fullName = "Full name is required.";
	} else if (fullName.length < 2) {
		errors.fullName = "Please enter at least 2 characters.";
	} else if (fullName.length > 200) {
		errors.fullName = "Name must be at most 200 characters.";
	}

	if (!form.dob) {
		errors.dob = "Date of birth is required.";
	} else {
		const dob = new Date(`${form.dob}T12:00:00`);
		if (Number.isNaN(dob.getTime())) {
			errors.dob = "Please enter a valid date.";
		} else {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const compare = new Date(dob);
			compare.setHours(0, 0, 0, 0);
			if (compare > today) {
				errors.dob = "Date of birth cannot be in the future.";
			} else {
				let age = today.getFullYear() - dob.getFullYear();
				const monthDiff = today.getMonth() - dob.getMonth();
				if (
					monthDiff < 0 ||
					(monthDiff === 0 && today.getDate() < dob.getDate())
				) {
					age--;
				}
				if (age < 10) {
					errors.dob = "Applicants must be at least 10 years old.";
				}
				if (age > 100) {
					errors.dob = "Please verify your date of birth.";
				}
			}
		}
	}

	const email = form.email.trim();
	if (!email) {
		errors.email = "Email is required.";
	} else if (!EMAIL_REGEX.test(email)) {
		errors.email = "Please enter a valid email address.";
	} else if (email.length > 200) {
		errors.email = "Email is too long.";
	}

	const phoneDigits = form.phone.replace(/\D/g, "");
	if (!form.phone.trim()) {
		errors.phone = "Phone number is required.";
	} else if (phoneDigits.length < 10) {
		errors.phone = "Enter a valid number with at least 10 digits.";
	} else if (phoneDigits.length > 15) {
		errors.phone = "Phone number has too many digits (max 15).";
	}

	const nationality = form.nationality.trim();
	if (!nationality) {
		errors.nationality = "Nationality is required.";
	} else if (nationality.length < 2) {
		errors.nationality = "Please enter at least 2 characters.";
	}

	const weightStr = form.weight.trim().replace(",", ".");
	if (!weightStr) {
		errors.weight = "Weight is required.";
	} else {
		const w = Number.parseFloat(weightStr);
		if (Number.isNaN(w)) {
			errors.weight = "Please enter a valid weight in kg.";
		} else if (w < 25 || w > 250) {
			errors.weight = "Enter a weight between 25 and 250 kg.";
		}
	}

	if (!form.batch.trim()) {
		errors.batch = "Please select which batch you are applying for.";
	}

	const education = form.education.trim();
	if (!education) {
		errors.education = "Education is required.";
	} else if (education.length < 2) {
		errors.education = "Please enter your education (at least 2 characters).";
	}

	if (!form.fitnessLevel) {
		errors.fitnessLevel = "Please select your fitness level.";
	} else if (!fitnessLevels.includes(form.fitnessLevel)) {
		errors.fitnessLevel = "Please select a valid fitness level.";
	}

	const sportsHistory = form.sportsHistory.trim();
	if (!sportsHistory) {
		errors.sportsHistory =
			'This field is required. Write "None" if you have no prior experience.';
	} else if (sportsHistory.length < 4) {
		errors.sportsHistory =
			'Please enter at least 4 characters (e.g. "Football).';
	}

	const coordinationActivities = form.coordinationActivities.trim();
	if (!coordinationActivities) {
		errors.coordinationActivities =
			'This field is required. Write "None" if not applicable.';
	} else if (coordinationActivities.length < 4) {
		errors.coordinationActivities =
			'Please enter at least 4 characters (e.g. "Football).';
	}

	if (!form.fearHandling) {
		errors.fearHandling = "Please select how you handle fear.";
	} else if (!fearHandlingOptions.includes(form.fearHandling)) {
		errors.fearHandling = "Please select a valid option.";
	}

	const motivation = form.motivation.trim();
	if (!motivation) {
		errors.motivation = "Motivation is required.";
	} else if (motivation.length < 15) {
		errors.motivation =
			"Please write at least 15 characters about your motivation.";
	}

	return errors;
}

export default function StandardApplicationForm({
	course,
	onSubmitted,
	onBack,
}: {
	course: Course;
	onSubmitted: () => void;
	onBack: () => void;
}) {
	const { control, handleSubmit, setError, clearErrors } =
		useForm<ApplicationForm>({
			defaultValues: emptyForm,
		});
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const batchOptions = course.schedule?.sessions ?? [];

	const onSubmit: SubmitHandler<ApplicationForm> = async (data) => {
		if (submitting) return;

		const validationErrors = validateApplicationForm(data);
		const invalidKeys = Object.keys(
			validationErrors,
		) as (keyof ApplicationForm)[];
		if (invalidKeys.length > 0) {
			for (const key of invalidKeys) {
				const msg = validationErrors[key];
				if (msg) {
					setError(key, { type: "manual", message: msg });
				}
			}
			return;
		}

		setSubmitting(true);
		setErrorMessage(null);

		try {
			const response = await fetch("/api/apply-course", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					course: {
						title: course.title,
						duration: course.duration,
						venue: course.venue,
						cost: course.cost,
					},
					application: data,
				}),
			});

			const parsed = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
			};

			if (!response.ok || !parsed.ok) {
				throw new Error(
					parsed.error ?? "Something went wrong. Please try again.",
				);
			}

			onSubmitted();
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Something went wrong. Please try again.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
			<Stack spacing={2.5}>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="fullName"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Full Name"
									fullWidth
									required
									autoComplete="name"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("fullName");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="dob"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Date of Birth"
									type="date"
									fullWidth
									required
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("dob");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
									slotProps={{ inputLabel: { shrink: true } }}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="email"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Email Address"
									type="email"
									placeholder="you@example.com"
									fullWidth
									required
									autoComplete="email"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("email");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="phone"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Phone Number"
									placeholder="+91 98765 43210"
									fullWidth
									required
									type="tel"
									autoComplete="tel"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("phone");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="nationality"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Nationality"
									fullWidth
									required
									autoComplete="country"
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("nationality");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="weight"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Weight (kg)"
									type="number"
									fullWidth
									required
									inputProps={{ min: 25, max: 250, step: "any" }}
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("weight");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<Controller
							name="batch"
							control={control}
							render={({ field, fieldState }) => (
								<FormControl
									fullWidth
									required
									error={Boolean(fieldState.error)}
									variant="outlined"
								>
									<InputLabel id="apply-course-batch-label" shrink>
										Which batch are you applying for?
									</InputLabel>
									<Select
										labelId="apply-course-batch-label"
										id="apply-course-batch"
										label="Which batch are you applying for?"
										value={field.value}
										onChange={(e: SelectChangeEvent<string>) => {
											field.onChange(e.target.value);
											clearErrors("batch");
										}}
										onBlur={field.onBlur}
										name={field.name}
										inputRef={field.ref}
										displayEmpty
										renderValue={(selected) => {
											if (!selected) {
												return (
													<Typography
														component="span"
														sx={{ color: "text.secondary" }}
													>
														Select a batch
													</Typography>
												);
											}
											return selected;
										}}
										MenuProps={{ ...dialogSelectMenuProps }}
									>
										{batchOptions.length === 0 ? (
											<MenuItem value="Flexible / TBD">
												Flexible / TBD
											</MenuItem>
										) : (
											[
												...batchOptions.map((batch) => (
													<MenuItem key={batch} value={batch}>
														{batch}
													</MenuItem>
												)),
												<MenuItem key="not-sure" value="Not sure yet">
													Not sure yet
												</MenuItem>,
											]
										)}
									</Select>
									{(fieldState.error != null ||
										batchOptions.length === 0) && (
										<FormHelperText error={Boolean(fieldState.error)}>
											{fieldState.error?.message ??
												"Dates TBD — we'll confirm available batches with you"}
										</FormHelperText>
									)}
								</FormControl>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="education"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Education"
									placeholder="e.g. B.Tech (CSE), BA, etc."
									fullWidth
									required
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("education");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<Controller
							name="fitnessLevel"
							control={control}
							render={({ field, fieldState }) => (
								<FormControl
									fullWidth
									required
									error={Boolean(fieldState.error)}
									variant="outlined"
								>
									<InputLabel id="apply-course-fitness-label" shrink>
										Fitness Level
									</InputLabel>
									<Select
										labelId="apply-course-fitness-label"
										id="apply-course-fitness"
										label="Fitness Level"
										value={field.value}
										onChange={(e: SelectChangeEvent<string>) => {
											field.onChange(e.target.value);
											clearErrors("fitnessLevel");
										}}
										onBlur={field.onBlur}
										name={field.name}
										inputRef={field.ref}
										displayEmpty
										renderValue={(selected) => {
											if (!selected) {
												return (
													<Typography
														component="span"
														sx={{ color: "text.secondary" }}
													>
														Select fitness level
													</Typography>
												);
											}
											return selected;
										}}
										MenuProps={{ ...dialogSelectMenuProps }}
									>
										{fitnessLevels.map((level) => (
											<MenuItem key={level} value={level}>
												{level}
											</MenuItem>
										))}
									</Select>
									{fieldState.error && (
										<FormHelperText>
											{fieldState.error.message}
										</FormHelperText>
									)}
								</FormControl>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<Controller
							name="sportsHistory"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Sports or adventure sports played in the past"
									fullWidth
									required
									multiline
									rows={2}
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("sportsHistory");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={
										fieldState.error?.message ??
										'Use at least 5 characters; use "None" if applicable.'
									}
								/>
							)}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Controller
							name="coordinationActivities"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Activities that include coordination (Dance, Yoga, Pilates, etc.)"
									fullWidth
									required
									multiline
									rows={2}
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("coordinationActivities");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={
										fieldState.error?.message ??
										'Use at least 5 characters; use "None" if not applicable.'
									}
								/>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<Controller
							name="fearHandling"
							control={control}
							render={({ field, fieldState }) => (
								<FormControl
									fullWidth
									required
									error={Boolean(fieldState.error)}
									variant="outlined"
								>
									<InputLabel id="apply-course-fear-label" shrink>
										How well do you think you handle fear?
									</InputLabel>
									<Select
										labelId="apply-course-fear-label"
										id="apply-course-fear"
										label="How well do you think you handle fear?"
										value={field.value}
										onChange={(e: SelectChangeEvent<string>) => {
											field.onChange(e.target.value);
											clearErrors("fearHandling");
										}}
										onBlur={field.onBlur}
										name={field.name}
										inputRef={field.ref}
										displayEmpty
										renderValue={(selected) => {
											if (!selected) {
												return (
													<Typography
														component="span"
														sx={{ color: "text.secondary" }}
													>
														Select an option
													</Typography>
												);
											}
											return selected;
										}}
										MenuProps={{ ...dialogSelectMenuProps }}
									>
										{fearHandlingOptions.map((option) => (
											<MenuItem key={option} value={option}>
												{option}
											</MenuItem>
										))}
									</Select>
									{fieldState.error && (
										<FormHelperText>
											{fieldState.error.message}
										</FormHelperText>
									)}
								</FormControl>
							)}
						/>
					</Grid>

					<Grid size={{ xs: 12 }}>
						<Controller
							name="motivation"
							control={control}
							render={({ field, fieldState }) => (
								<TextField
									label="Motivation for getting into paragliding"
									fullWidth
									multiline
									rows={3}
									required
									value={field.value}
									onChange={(e) => {
										field.onChange(e);
										clearErrors("motivation");
									}}
									onBlur={field.onBlur}
									name={field.name}
									inputRef={field.ref}
									error={Boolean(fieldState.error)}
									helperText={
										fieldState.error?.message ??
										"Please write at least 15 characters."
									}
								/>
							)}
						/>
					</Grid>
				</Grid>

				{errorMessage && (
					<Alert severity="error" onClose={() => setErrorMessage(null)}>
						{errorMessage}
					</Alert>
				)}

				<Box
					sx={{
						pt: 2,
						borderTop: "1px solid #E2E8F0",
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						justifyContent: "space-between",
						alignItems: { xs: "stretch", sm: "center" },
						gap: 2,
					}}
				>
					<Button
						variant="text"
						onClick={onBack}
						disabled={submitting}
						sx={{ color: "#5A6370", textTransform: "none" }}
					>
						← Back to course details
					</Button>
					<Button
						type="submit"
						variant="contained"
						size="large"
						disabled={submitting}
						endIcon={
							submitting ? (
								<CircularProgress size={18} sx={{ color: "inherit" }} />
							) : (
								<SendIcon />
							)
						}
						sx={{
							px: 4,
							py: 1.25,
							textTransform: "none",
							fontWeight: 600,
						}}
					>
						{submitting ? "Submitting…" : "Submit Application"}
					</Button>
				</Box>
			</Stack>
		</Box>
	);
}
