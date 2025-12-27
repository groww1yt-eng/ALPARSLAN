import type { DownloadMode, ContentType, NamingValidationError } from '@/types';

// Invalid characters for filenames (Windows-safe)
const INVALID_CHARS_REGEX = /[<>:"|?*\\/]/g;

// All supported tags
const ALL_TAGS = ['<title>', '<index>', '<quality>', '<channel>', '<date>', '<format>'];

// Get mandatory tags based on content type and mode
export function getMandatoryTags(contentType: ContentType, mode: DownloadMode): string[] {
  const mandatory: string[] = ['<title>'];
  
  if (contentType === 'playlist') {
    mandatory.push('<index>');
  }
  
  if (mode === 'video') {
    mandatory.push('<quality>');
  }
  
  return mandatory;
}

// Get allowed tags based on content type and mode
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

// Extract all tags from a template
export function extractTags(template: string): string[] {
  const tagRegex = /<[^>]+>/g;
  const matches = template.match(tagRegex) || [];
  return matches.filter((tag) => ALL_TAGS.includes(tag));
}

// Check for invalid characters (user-typed)
export function hasInvalidCharacters(template: string): boolean {
  // Extract tag contents and remove them first to avoid checking tag syntax
  const withoutTags = template.replace(/<[^>]+>/g, '');
  return INVALID_CHARS_REGEX.test(withoutTags);
}

// Get invalid characters found in template
export function getInvalidCharacters(template: string): string[] {
  const withoutTags = template.replace(/<[^>]+>/g, '');
  const matches = withoutTags.match(INVALID_CHARS_REGEX) || [];
  return [...new Set(matches)]; // Unique values
}

// Validate naming template
export function validateNamingTemplate(
  template: string,
  contentType: ContentType,
  mode: DownloadMode
): NamingValidationError | null {
  // Check if empty
  if (!template.trim()) {
    return {
      type: 'empty',
      message: 'Template cannot be empty',
    };
  }

  // Check for invalid characters
  if (hasInvalidCharacters(template)) {
    const invalidChars = getInvalidCharacters(template);
    return {
      type: 'invalid_character',
      message: `Invalid characters found: "${invalidChars.join(', ')}". These are reserved for filenames.`,
    };
  }

  // Extract tags from template
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
      type: 'missing_mandatory',
      message: `Missing required tags for ${typeText} (${modeText}): ${tagList}`,
    };
  }

  // Check for disallowed tags
  const invalidTags = tagsInTemplate.filter((tag) => !allowedTags.includes(tag));
  if (invalidTags.length > 0) {
    const typeText = contentType === 'playlist' ? 'Playlist' : 'Single';
    const tag = invalidTags[0];
    
    if (tag === '<index>' && contentType === 'single') {
      return {
        type: 'invalid_tag',
        message: `The tag ${tag} is not allowed for Single videos (only for Playlists).`,
      };
    }
    
    if (tag === '<quality>' && mode === 'audio') {
      return {
        type: 'invalid_quality',
        message: `The tag ${tag} is not allowed in Audio Only mode.`,
      };
    }
  }

  return null;
}

// Get default template based on type and mode
export function getDefaultTemplate(contentType: ContentType, mode: DownloadMode): string {
  if (contentType === 'single') {
    return mode === 'video' ? '<title> - <quality>' : '<title>';
  } else {
    // playlist
    return mode === 'video' ? '<index> - <title> - <quality>' : '<index> - <title>';
  }
}

// Sanitize filename by removing/replacing invalid characters
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*\\/]/g, '_');
}

// Replace tags with actual values
export function replaceTagsInTemplate(
  template: string,
  replacements: Record<string, string>
): string {
  let result = template;
  
  for (const [tag, value] of Object.entries(replacements)) {
    // Sanitize the replacement value to remove invalid characters
    const sanitized = sanitizeFilename(value);
    result = result.replace(new RegExp(tag, 'g'), sanitized);
  }
  
  return result;
}
