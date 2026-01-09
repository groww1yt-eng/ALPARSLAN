/**
 * Backend Naming Resolution Module
 * 
 * Handles filename template resolution, validation, and sanitization
 * for the download system. This is the single source of truth for
 * filename generation to ensure consistency across the application.
 */

export type DownloadMode = 'video' | 'audio';
export type ContentType = 'single' | 'playlist';

// Interface for validation results of a naming template
export interface NamingValidationResult {
    valid: boolean;
    message?: string;
    type?: 'empty' | 'missing_mandatory' | 'invalid_tag' | 'invalid_character' | 'invalid_quality' | 'invalid_index';
}

// Params needed to resolve a template into a real filename
export interface ResolveFilenameParams {
    template: string;
    title: string;
    channel: string;
    quality?: string;
    format: string;
    index?: number; // Playlist index
    date: string;
    mode: DownloadMode;
    contentType: ContentType;
}

// Characters invalid for Windows/Unix filenames (reserved characters)
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

// All supported tags available to users
const ALL_TAGS = ['<title>', '<index>', '<quality>', '<channel>', '<date>', '<format>'];

/**
 * Sanitize metadata values from YouTube (automatic, always applied)
 * Replaces invalid filesystem characters with safe alternatives
 * e.g., "AC/DC" -> "AC_DC"
 */
export function sanitizeMetadata(value: string): string {
    const replacements: Record<string, string> = {
        ':': ' - ',
        '/': '_',
        '\\': '_',
        '?': '',
        '"': "'",
        '<': '[',
        '>': ']',
        '|': '-',
        '*': '_',
    };

    let sanitized = value;
    for (const [illegal, replacement] of Object.entries(replacements)) {
        sanitized = sanitized.replace(new RegExp(`[${illegal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g'), replacement);
    }

    // Remove trailing dots and spaces (Windows restriction)
    sanitized = sanitized.replace(/[\s.]+$/, '');

    return sanitized;
}

/**
 * Check if user-typed template contains invalid filesystem characters
 * (excluding tag syntax which uses < and >)
 */
export function hasInvalidUserCharacters(template: string): boolean {
    // Remove tags first to avoid flagging < and > in tag syntax
    const withoutTags = template.replace(/<[^>]+>/g, '');
    return INVALID_FILENAME_CHARS.test(withoutTags);
}

/**
 * Get invalid characters found in template (for error messages)
 */
export function getInvalidCharacters(template: string): string[] {
    const withoutTags = template.replace(/<[^>]+>/g, '');
    const matches = withoutTags.match(INVALID_FILENAME_CHARS) || [];
    return [...new Set(matches)]; // Return unique characters
}

/**
 * Extract all tags from a template string
 */
export function extractTags(template: string): string[] {
    const tagRegex = /<[^>]+>/g;
    const matches = template.match(tagRegex) || [];
    return matches.filter((tag) => ALL_TAGS.includes(tag));
}

/**
 * Get list of mandatory tags that MUST be present based on context
 */
export function getMandatoryTags(contentType: ContentType, mode: DownloadMode): string[] {
    const mandatory: string[] = ['<title>']; // Title is always mandatory

    if (contentType === 'playlist') {
        mandatory.push('<index>'); // Playlist items must have index to keep order
    }

    if (mode === 'video') {
        mandatory.push('<quality>'); // Video files should specify quality to avoid ambiguity
    }

    return mandatory;
}

/**
 * Get allowed tags based on content type and mode
 */
export function getAllowedTags(contentType: ContentType, mode: DownloadMode): string[] {
    const allowed = ['<title>', '<channel>', '<date>', '<format>'];

    if (contentType === 'playlist') {
        allowed.push('<index>');
    }

    if (mode === 'video') {
        allowed.push('<quality>');
    }

    return allowed;
}

/**
 * Validate a user-provided naming template
 * Returns validation result with detailed error messages if invalid
 */
export function validateTemplate(
    template: string,
    contentType: ContentType,
    mode: DownloadMode
): NamingValidationResult {
    // Check if empty
    if (!template.trim()) {
        return {
            valid: false,
            type: 'empty',
            message: 'Template cannot be empty',
        };
    }

    // Check for invalid characters in literal portions
    if (hasInvalidUserCharacters(template)) {
        const invalidChars = getInvalidCharacters(template);
        return {
            valid: false,
            type: 'invalid_character',
            message: `Invalid characters found: "${invalidChars.join(', ')}". These are reserved for filenames.`,
        };
    }

    // Extract tags from template for logic validation
    const tagsInTemplate = extractTags(template);
    const mandatoryTags = getMandatoryTags(contentType, mode);
    const allowedTags = getAllowedTags(contentType, mode);

    // Check if all mandatory tags are present
    const missingMandatory = mandatoryTags.filter((tag) => !tagsInTemplate.includes(tag));
    if (missingMandatory.length > 0) {
        const tagList = missingMandatory.join(', ');
        const typeText = contentType === 'playlist' ? 'Playlist' : 'Single';
        const modeText = mode === 'video' ? 'Video mode' : 'Audio mode';
        return {
            valid: false,
            type: 'missing_mandatory',
            message: `Missing required tags for ${typeText} (${modeText}): ${tagList}`,
        };
    }

    // Check for disallowed tags (e.g. index in single Video)
    const invalidTags = tagsInTemplate.filter((tag) => !allowedTags.includes(tag));
    if (invalidTags.length > 0) {
        const tag = invalidTags[0];

        if (tag === '<index>' && contentType === 'single') {
            return {
                valid: false,
                type: 'invalid_index',
                message: `The tag ${tag} is not allowed for Single videos (only for Playlists).`,
            };
        }

        if (tag === '<quality>' && mode === 'audio') {
            return {
                valid: false,
                type: 'invalid_quality',
                message: `The tag ${tag} is not allowed in Audio Only mode.`,
            };
        }
    }

    return { valid: true };
}

/**
 * Resolve a filename template to an actual filename string
 * Replaces all tags with their actual sanitized values
 */
export function resolveFilename(params: ResolveFilenameParams): string {
    const { template, title, channel, quality, format, index, date, mode } = params;

    // Build replacements map with sanitized values
    const replacements: Record<string, string> = {
        '<title>': sanitizeMetadata(title),
        '<channel>': sanitizeMetadata(channel),
        '<date>': date,
        '<format>': format.toUpperCase(),
    };

    // Add quality only for video mode (uppercase, e.g., "1080P")
    if (mode === 'video' && quality) {
        replacements['<quality>'] = quality.toUpperCase();
    }

    // Add index for playlists (zero-padded, e.g., "01", "02")
    if (index !== undefined) {
        replacements['<index>'] = String(index).padStart(2, '0');
    }

    // Replace all tags in the template
    let result = template;
    for (const [tag, value] of Object.entries(replacements)) {
        // use regex with global flag to replace all occurrences
        result = result.replace(new RegExp(tag.replace(/[<>]/g, '\\$&'), 'g'), value);
    }

    return result;
}

/**
 * Get current date in DD-MM-YYYY format
 */
export function getCurrentDate(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
}
