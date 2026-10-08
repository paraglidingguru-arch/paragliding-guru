"use client";

import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SendIcon from "@mui/icons-material/Send";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	type SelectChangeEvent,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FITNESS_LEVELS } from "@/lib/applications/shared";
import {
	emptySivApplication,
	FLIGHT_LOG_MAX_FILES,
	FLIGHT_LOG_MAX_TOTAL_BYTES,
	formatFileSize,
	isMinor,
	SIV_FIELD_LIMITS,
	type SivApplicationValues,
	type SivTextField,
	validateFlightLogs,
	validateSivApplication,
	withoutHiddenAnswers,
	YES_NO,
} from "@/lib/applications/siv";
import { batchOptions, type Course } from "@/lib/courses";
import { COUNTRIES } from "./countries";
import { dialogSelectMenuProps } from "./shared";

type TextInputOptions = {
	label: string;
	type?: string;
	placeholder?: string;
	autoComplete?: string;
	helperText?: string;
	multiline?: boolean;
	rows?: number;
	htmlInput?: Record<string, unknown>;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<Typography
			sx={{
				fontSize: 13,
				color: "#0D5C8F",
				textTransform: "uppercase",
				letterSpacing: "0.08em",
				fontWeight: 700,
				mb: 2,
			}}
		>
			{children}
		</Typography>
	);
}

export default function SivApplicationForm({
	course,
	onSubmitted,
	onBack,
}: {
	course: Course;
	onSubmitted: () => void;
	onBack: () => void;
}) {
	const { control, getValues, setError, clearErrors, setFocus } =
		useForm<SivApplicationValues>({
			defaultValues: emptySivApplication,
		});
	const [dob, sivBefore, hasInjury] = useWatch({
		control,
		name: ["dob", "sivBefore", "hasInjury"],
	});
	const [files, setFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const fileButtonRef = useRef<HTMLButtonElement>(null);
	const honeypotRef = useRef<HTMLInputElement>(null);

	const minor = isMinor(dob);
	const batches = batchOptions(course);

	const textField = (name: SivTextField, options: TextInputOptions) => (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<TextField
					label={options.label}
					type={options.type}
					placeholder={options.placeholder}
					autoComplete={options.autoComplete}
					multiline={options.multiline}
					rows={options.rows}
					fullWidth
					required
					value={field.value}
					onChange={(e) => {
						field.onChange(e);
						clearErrors(name);
					}}
					onBlur={field.onBlur}
					name={field.name}
					inputRef={field.ref}
					error={Boolean(fieldState.error)}
					helperText={fieldState.error?.message ?? options.helperText}
					slotProps={{
						inputLabel: options.type === "date" ? { shrink: true } : undefined,
						htmlInput: { maxLength: SIV_FIELD_LIMITS[name], ...options.htmlInput },
					}}
				/>
			)}
		/>
	);

	const selectField = (
		name: "batch" | "fitnessLevel",
		label: string,
		placeholder: string,
		choices: readonly string[],
		helperText?: string,
	) => (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<FormControl
					fullWidth
					required
					error={Boolean(fieldState.error)}
					variant="outlined"
				>
					<InputLabel id={`siv-${name}-label`} shrink>
						{label}
					</InputLabel>
					<Select
						labelId={`siv-${name}-label`}
						id={`siv-${name}`}
						label={label}
						value={field.value}
						onChange={(e: SelectChangeEvent<string>) => {
							field.onChange(e.target.value);
							clearErrors(name);
						}}
						onBlur={field.onBlur}
						name={field.name}
						inputRef={field.ref}
						displayEmpty
						renderValue={(selected) =>
							selected ? (
								selected
							) : (
								<Typography component="span" sx={{ color: "text.secondary" }}>
									{placeholder}
								</Typography>
							)
						}
						MenuProps={{ ...dialogSelectMenuProps }}
					>
						{choices.map((choice) => (
							<MenuItem key={choice} value={choice}>
								{choice}
							</MenuItem>
						))}
					</Select>
					{(fieldState.error || helperText) && (
						<FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
					)}
				</FormControl>
			)}
		/>
	);

	const yesNoField = (name: "sivBefore" | "hasInjury", label: string) => (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<FormControl required error={Boolean(fieldState.error)} component="fieldset">
					<FormLabel component="legend" sx={{ color: "#1A1D21", fontSize: 15, mb: 0.5 }}>
						{label}
					</FormLabel>
					<RadioGroup
						row
						name={field.name}
						value={field.value}
						onChange={(e) => {
							field.onChange(e.target.value);
							clearErrors(name);
						}}
						onBlur={field.onBlur}
					>
						{YES_NO.map((option, index) => (
							<FormControlLabel
								key={option}
								value={option}
								label={option}
								control={<Radio inputRef={index === 0 ? field.ref : undefined} />}
							/>
						))}
					</RadioGroup>
					{fieldState.error && (
						<FormHelperText>{fieldState.error.message}</FormHelperText>
					)}
				</FormControl>
			)}
		/>
	);

	const updateFiles = (next: File[]) => {
		setFiles(next);
		setFileError(validateFlightLogs(next));
	};

	const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
		const picked = Array.from(event.target.files ?? []);
		// Reset so picking the same file again still fires a change event.
		event.target.value = "";
		const next = [...files];
		for (const file of picked) {
			const duplicate = next.some(
				(existing) =>
					existing.name === file.name &&
					existing.size === file.size &&
					existing.lastModified === file.lastModified,
			);
			if (!duplicate) next.push(file);
		}
		updateFiles(next);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;

		const values = withoutHiddenAnswers(getValues());
		clearErrors();
		setErrorMessage(null);

		const errors = validateSivApplication(values);
		const invalidKeys = Object.keys(errors) as (keyof SivApplicationValues)[];
		for (const key of invalidKeys) {
			setError(key, { type: "manual", message: errors[key] });
		}
		const filesProblem = validateFlightLogs(files);
		setFileError(filesProblem);

		if (invalidKeys.length > 0) {
			setFocus(invalidKeys[0]);
			return;
		}
		if (filesProblem) {
			fileButtonRef.current?.focus();
			return;
		}

		const body = new FormData();
		body.append("courseTitle", course.title);
		body.append("website", honeypotRef.current?.value ?? "");
		for (const [key, value] of Object.entries(values)) {
			body.append(key, String(value));
		}
		for (const file of files) {
			body.append("flightLogs", file, file.name);
		}

		setSubmitting(true);
		try {
			const response = await fetch("/api/apply-course/siv", {
				method: "POST",
				body,
			});

			if (response.status === 413) {
				throw new Error(
					`Your files are too large. Please keep them under ${formatFileSize(FLIGHT_LOG_MAX_TOTAL_BYTES)} in total.`,
				);
			}

			const parsed = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
				fieldErrors?: Record<string, string>;
			};

			if (!response.ok || !parsed.ok) {
				for (const [key, message] of Object.entries(parsed.fieldErrors ?? {})) {
					if (key === "flightLogs") {
						setFileError(message);
					} else if (key in emptySivApplication) {
						setError(key as keyof SivApplicationValues, {
							type: "server",
							message,
						});
					}
				}
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
		<Box component="form" onSubmit={handleSubmit} noValidate>
			{/* Honeypot: hidden from people, so only bots fill it in. */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					left: "-10000px",
					width: 1,
					height: 1,
					overflow: "hidden",
				}}
			>
				<label>
					Website
					<input
						ref={honeypotRef}
						type="text"
						name="website"
						tabIndex={-1}
						autoComplete="off"
					/>
				</label>
			</Box>

			<Stack spacing={4}>
				<Box>
					<SectionTitle>Personal details</SectionTitle>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("fullName", { label: "Full Name", autoComplete: "name" })}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("dob", { label: "Date of Birth", type: "date" })}
						</Grid>

						{minor && (
							<Grid size={{ xs: 12 }}>
								<Box
									sx={{
										p: { xs: 2, md: 2.5 },
										borderRadius: 2,
										bgcolor: "#F8FAFC",
										border: "1px solid #E2E8F0",
									}}
								>
									<Alert severity="info" sx={{ mb: 2 }}>
										The applicant is under 18, so we also need a parent or legal
										guardian&apos;s details.
									</Alert>
									<Grid container spacing={2}>
										<Grid size={{ xs: 12 }}>
											{textField("guardianName", {
												label: "Parent / Legal Guardian Name",
											})}
										</Grid>
										<Grid size={{ xs: 12, sm: 6 }}>
											{textField("guardianPhone", {
												label: "Parent / Legal Guardian Phone Number",
												type: "tel",
												placeholder: "+91 98765 43210",
											})}
										</Grid>
										<Grid size={{ xs: 12, sm: 6 }}>
											{textField("guardianEmail", {
												label: "Parent / Legal Guardian Email",
												type: "email",
												placeholder: "parent@example.com",
											})}
										</Grid>
										<Grid size={{ xs: 12 }}>
											<Controller
												name="guardianConsent"
												control={control}
												render={({ field, fieldState }) => (
													<FormControl required error={Boolean(fieldState.error)}>
														<FormControlLabel
															label="The parent / legal guardian consents to this application"
															control={
																<Checkbox
																	checked={field.value}
																	onChange={(e) => {
																		field.onChange(e.target.checked);
																		clearErrors("guardianConsent");
																	}}
																	onBlur={field.onBlur}
																	name={field.name}
																	inputRef={field.ref}
																/>
															}
														/>
														<FormHelperText sx={{ mx: 0 }}>
															{fieldState.error?.message ??
																"We'll follow up with them by email to confirm."}
														</FormHelperText>
													</FormControl>
												)}
											/>
										</Grid>
									</Grid>
								</Box>
							</Grid>
						)}

						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("email", {
								label: "Email Address",
								type: "email",
								placeholder: "you@example.com",
								autoComplete: "email",
							})}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("phone", {
								label: "Phone Number",
								type: "tel",
								placeholder: "+91 98765 43210",
								autoComplete: "tel",
							})}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<Controller
								name="nationality"
								control={control}
								render={({ field, fieldState }) => (
									<Autocomplete
										freeSolo
										options={COUNTRIES}
										inputValue={field.value}
										onInputChange={(_, value) => {
											field.onChange(value);
											clearErrors("nationality");
										}}
										renderInput={(params) => (
											<TextField
												{...params}
												label="Nationality"
												placeholder="Start typing your country"
												required
												name={field.name}
												inputRef={field.ref}
												onBlur={field.onBlur}
												error={Boolean(fieldState.error)}
												helperText={fieldState.error?.message}
												slotProps={{
													htmlInput: {
														...params.inputProps,
														maxLength: SIV_FIELD_LIMITS.nationality,
													},
												}}
											/>
										)}
									/>
								)}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("weight", {
								label: "Weight (kg)",
								type: "number",
								htmlInput: { min: 25, max: 250, step: "any" },
							})}
						</Grid>
					</Grid>
				</Box>

				<Box>
					<SectionTitle>Batch &amp; fitness</SectionTitle>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							{selectField(
								"batch",
								"Which batch are you applying for?",
								"Select a batch",
								batches,
								batches.includes("Flexible / TBD")
									? "Dates TBD — we'll confirm available batches with you"
									: undefined,
							)}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{selectField(
								"fitnessLevel",
								"Fitness Level",
								"Select fitness level",
								FITNESS_LEVELS,
							)}
						</Grid>
					</Grid>
				</Box>

				<Box>
					<SectionTitle>Flying experience &amp; equipment</SectionTitle>
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("pilotRating", {
								label: "Pilot Rating / Licence",
								placeholder: "e.g. P3, IPPI 4",
							})}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("flyingHours", {
								label: "Total Flying Hours",
								type: "number",
								htmlInput: { min: 0, step: "any" },
							})}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("wing", { label: "Wing – Make / Model / Size" })}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("harness", { label: "Harness – Make / Model" })}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("reserve", { label: "Reserve – Make / Model" })}
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							{textField("reserveRepackDate", {
								label: "Reserve – Last Repack Date",
								type: "date",
							})}
						</Grid>
					</Grid>
				</Box>

				<Box>
					<SectionTitle>Safety</SectionTitle>
					<Stack spacing={2}>
						{yesNoField("sivBefore", "Have you done an SIV before?")}
						{sivBefore === "Yes" &&
							textField("sivBeforeDetails", {
								label: "When and where?",
								placeholder: "e.g. March 2024 at Lake Annecy",
							})}
						{yesNoField(
							"hasInjury",
							"Any previous injury, physical limitation, or safety information the instructor should know?",
						)}
						{hasInjury === "Yes" &&
							textField("injuryDetails", {
								label: "Please explain",
								multiline: true,
								rows: 3,
							})}
					</Stack>
				</Box>

				<Box>
					<SectionTitle>Upload your flight logs</SectionTitle>
					<Typography sx={{ color: "#5A6370", fontSize: 14, mb: 1.5 }}>
						Optional. Up to {FLIGHT_LOG_MAX_FILES} files,{" "}
						{formatFileSize(FLIGHT_LOG_MAX_TOTAL_BYTES)} in total —
						IGC, GPX, KML, KMZ or CSV.
					</Typography>
					{/* No `accept` filter: iOS can grey out extensions it doesn't know (e.g. .igc). */}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						hidden
						onChange={handleFilesPicked}
					/>
					<Button
						ref={fileButtonRef}
						variant="outlined"
						startIcon={<UploadFileIcon />}
						onClick={() => fileInputRef.current?.click()}
						disabled={submitting || files.length >= FLIGHT_LOG_MAX_FILES}
						sx={{ textTransform: "none" }}
					>
						Choose files
					</Button>
					{files.length > 0 && (
						<Stack spacing={1} sx={{ mt: 1.5 }}>
							{files.map((file, index) => (
								<Stack
									key={`${file.name}-${file.size}-${file.lastModified}`}
									direction="row"
									spacing={1.5}
									alignItems="center"
									sx={{
										px: 1.5,
										py: 1,
										borderRadius: 2,
										border: "1px solid #E2E8F0",
										bgcolor: "#F8FAFC",
									}}
								>
									<InsertDriveFileOutlinedIcon sx={{ color: "#0D5C8F", fontSize: 20 }} />
									<Typography
										sx={{
											flex: 1,
											minWidth: 0,
											fontSize: 14,
											color: "#1A1D21",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{file.name}
									</Typography>
									<Typography sx={{ fontSize: 13, color: "#94A3B8", flexShrink: 0 }}>
										{formatFileSize(file.size)}
									</Typography>
									<IconButton
										size="small"
										aria-label={`Remove ${file.name}`}
										onClick={() => updateFiles(files.filter((_, i) => i !== index))}
										disabled={submitting}
									>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Stack>
							))}
						</Stack>
					)}
					{fileError && (
						<FormHelperText error sx={{ mt: 1 }}>
							{fileError}
						</FormHelperText>
					)}
				</Box>

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
