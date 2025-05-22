// export function ResumePreview({ resumeData }: { resumeData: any }) {
//   return (
//     <div className="bg-white p-4 h-[600px] overflow-auto">
//       <div className="text-center mb-4">
//         <h1 className="text-xl font-bold">{resumeData.personalInfo.fullName || "Your Name"}</h1>
//         <div className="text-sm text-gray-600 flex flex-wrap justify-center gap-2">
//           {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
//           {resumeData.personalInfo.phone && <span>• {resumeData.personalInfo.phone}</span>}
//           {resumeData.personalInfo.location && <span>• {resumeData.personalInfo.location}</span>}
//         </div>
//       </div>

//       {resumeData.personalInfo.summary && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Summary</h2>
//           <p className="text-sm">{resumeData.personalInfo.summary}</p>
//         </div>
//       )}

//       {resumeData.workExperience.some((exp) => exp.title || exp.company) && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Experience</h2>
//           {resumeData.workExperience.map(
//             (exp, index) =>
//               (exp.title || exp.company) && (
//                 <div key={exp.id} className="mb-3">
//                   <div className="flex justify-between">
//                     <div className="font-semibold text-sm">{exp.title || "Job Title"}</div>
//                     <div className="text-xs text-gray-600">
//                       {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : "Date Range"}
//                     </div>
//                   </div>
//                   <div className="text-sm">
//                     {exp.company || "Company"}
//                     {exp.location ? `, ${exp.location}` : ""}
//                   </div>
//                   {exp.description && <p className="text-xs mt-1">{exp.description}</p>}
//                 </div>
//               ),
//           )}
//         </div>
//       )}

//       {resumeData.education.some((edu) => edu.degree || edu.institution) && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Education</h2>
//           {resumeData.education.map(
//             (edu, index) =>
//               (edu.degree || edu.institution) && (
//                 <div key={edu.id} className="mb-3">
//                   <div className="flex justify-between">
//                     <div className="font-semibold text-sm">{edu.degree || "Degree"}</div>
//                     <div className="text-xs text-gray-600">
//                       {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : "Date Range"}
//                     </div>
//                   </div>
//                   <div className="text-sm">
//                     {edu.institution || "Institution"}
//                     {edu.location ? `, ${edu.location}` : ""}
//                   </div>
//                   {edu.description && <p className="text-xs mt-1">{edu.description}</p>}
//                 </div>
//               ),
//           )}
//         </div>
//       )}

//       {resumeData.skills.some((skill) => skill.name) && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Skills</h2>
//           <div className="flex flex-wrap gap-2">
//             {resumeData.skills.map(
//               (skill, index) =>
//                 skill.name && (
//                   <span key={skill.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
//                     {skill.name}
//                   </span>
//                 ),
//             )}
//           </div>
//         </div>
//       )}

//       {resumeData.languages.some((lang) => lang.name) && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Languages</h2>
//           <div className="flex flex-wrap gap-2">
//             {resumeData.languages.map(
//               (lang, index) =>
//                 lang.name && (
//                   <span key={lang.id} className="text-xs">
//                     {lang.name} ({lang.proficiency})
//                   </span>
//                 ),
//             )}
//           </div>
//         </div>
//       )}

//       {resumeData.certifications.some((cert) => cert.name) && (
//         <div className="mb-4">
//           <h2 className="text-sm font-bold uppercase border-b border-gray-300 mb-2">Certifications</h2>
//           {resumeData.certifications.map(
//             (cert, index) =>
//               cert.name && (
//                 <div key={cert.id} className="mb-2">
//                   <div className="text-sm font-semibold">{cert.name}</div>
//                   <div className="text-xs text-gray-600">
//                     {cert.issuer}
//                     {cert.date ? ` - ${cert.date}` : ""}
//                   </div>
//                 </div>
//               ),
//           )}
//         </div>
//       )}

//       {/* This is just a simplified preview. In a real app, you'd have different templates */}
//       <div className="text-xs text-center text-gray-400 mt-4">
//         This is a simplified preview. The actual resume will look more professional.
//       </div>
//     </div>
//   )
// }










// Define the ResumeData type directly in this file
type ResumeData = {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  workExperience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: number;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
  }>;
  languages: Array<{
    id: string;
    name: string;
    proficiency: string;
  }>;
  template: string;
};

// Define template styles interface
interface TemplateStyles {
  container: string;
  header: string;
  name: string;
  contactInfo: string;
  sectionTitle: string;
  summaryText: string;
  experienceItem: string;
  itemHeader: string;
  itemTitle: string;
  itemSubtitle: string;
  dateRange: string;
  itemDescription: string;
  skillsContainer: string;
  skillItem: string;
  languagesContainer: string;
  languageItem: string;
  certTitle: string;
  certSubtitle: string;
}

export function ResumePreview({ resumeData }: { resumeData: ResumeData }) {
  // Get template styles based on the selected template
  const templateStyles = getTemplateStyles(resumeData.template);
  
  return (
    <div className={`p-4 h-[600px] overflow-auto ${templateStyles.container}`}>
      <div className={`mb-4 ${templateStyles.header}`}>
        <h1 className={`font-bold ${templateStyles.name}`}>{resumeData.personalInfo.fullName || "Your Name"}</h1>
        <div className={`flex flex-wrap gap-2 ${templateStyles.contactInfo}`}>
          {resumeData.personalInfo.email && <span>{resumeData.personalInfo.email}</span>}
          {resumeData.personalInfo.phone && <span>• {resumeData.personalInfo.phone}</span>}
          {resumeData.personalInfo.location && <span>• {resumeData.personalInfo.location}</span>}
        </div>
      </div>

      {resumeData.personalInfo.summary && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Summary</h2>
          <p className={templateStyles.summaryText}>{resumeData.personalInfo.summary}</p>
        </div>
      )}

      {resumeData.workExperience.some((exp) => exp.title || exp.company) && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Experience</h2>
          {resumeData.workExperience.map(
            (exp, index) =>
              (exp.title || exp.company) && (
                <div key={exp.id} className={`mb-3 ${templateStyles.experienceItem}`}>
                  <div className={templateStyles.itemHeader}>
                    <div className={templateStyles.itemTitle}>{exp.title || "Job Title"}</div>
                    <div className={templateStyles.dateRange}>
                      {exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : "Date Range"}
                    </div>
                  </div>
                  <div className={templateStyles.itemSubtitle}>
                    {exp.company || "Company"}
                    {exp.location ? `, ${exp.location}` : ""}
                  </div>
                  {exp.description && <p className={templateStyles.itemDescription}>{exp.description}</p>}
                </div>
              ),
          )}
        </div>
      )}

      {resumeData.education.some((edu) => edu.degree || edu.institution) && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Education</h2>
          {resumeData.education.map(
            (edu, index) =>
              (edu.degree || edu.institution) && (
                <div key={edu.id} className="mb-3">
                  <div className={templateStyles.itemHeader}>
                    <div className={templateStyles.itemTitle}>{edu.degree || "Degree"}</div>
                    <div className={templateStyles.dateRange}>
                      {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : "Date Range"}
                    </div>
                  </div>
                  <div className={templateStyles.itemSubtitle}>
                    {edu.institution || "Institution"}
                    {edu.location ? `, ${edu.location}` : ""}
                  </div>
                  {edu.description && <p className={templateStyles.itemDescription}>{edu.description}</p>}
                </div>
              ),
          )}
        </div>
      )}

      {resumeData.skills.some((skill) => skill.name) && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Skills</h2>
          <div className={`flex flex-wrap gap-2 ${templateStyles.skillsContainer}`}>
            {resumeData.skills.map(
              (skill, index) =>
                skill.name && (
                  <span key={skill.id} className={templateStyles.skillItem}>
                    {skill.name}
                  </span>
                ),
            )}
          </div>
        </div>
      )}

      {resumeData.languages.some((lang) => lang.name) && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Languages</h2>
          <div className={`flex flex-wrap gap-2 ${templateStyles.languagesContainer}`}>
            {resumeData.languages.map(
              (lang, index) =>
                lang.name && (
                  <span key={lang.id} className={templateStyles.languageItem}>
                    {lang.name} ({lang.proficiency})
                  </span>
                ),
            )}
          </div>
        </div>
      )}

      {resumeData.certifications.some((cert) => cert.name) && (
        <div className="mb-4">
          <h2 className={`mb-2 ${templateStyles.sectionTitle}`}>Certifications</h2>
          {resumeData.certifications.map(
            (cert, index) =>
              cert.name && (
                <div key={cert.id} className="mb-2">
                  <div className={templateStyles.certTitle}>{cert.name}</div>
                  <div className={templateStyles.certSubtitle}>
                    {cert.issuer}
                    {cert.date ? ` - ${cert.date}` : ""}
                  </div>
                </div>
              ),
          )}
        </div>
      )}

      {/* This is just a simplified preview. In a real app, you'd have different templates */}
      <div className="text-xs text-center text-gray-400 mt-4">
        This is a simplified preview. The actual resume will look more professional.
      </div>
    </div>
  )
}

// Helper function to get styles based on template type
function getTemplateStyles(template: string): TemplateStyles {
  const baseStyles: TemplateStyles = {
    container: "bg-white",
    header: "text-center",
    name: "text-xl",
    contactInfo: "text-sm text-gray-600 justify-center",
    sectionTitle: "text-sm font-bold uppercase border-b border-gray-300",
    summaryText: "text-sm",
    experienceItem: "",
    itemHeader: "flex justify-between",
    itemTitle: "font-semibold text-sm",
    itemSubtitle: "text-sm",
    dateRange: "text-xs text-gray-600",
    itemDescription: "text-xs mt-1",
    skillsContainer: "",
    skillItem: "text-xs bg-gray-100 px-2 py-1 rounded",
    languagesContainer: "",
    languageItem: "text-xs",
    certTitle: "text-sm font-semibold",
    certSubtitle: "text-xs text-gray-600"
  };

  switch (template) {
    case "modern":
      return {
        ...baseStyles,
        container: "bg-white",
        header: "text-center",
        name: "text-2xl text-blue-700",
        sectionTitle: "text-sm font-bold uppercase text-blue-700 border-b border-blue-200",
        skillItem: "text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
      };

    case "classic":
      return {
        ...baseStyles,
        container: "bg-slate-50",
        header: "text-center mb-6",
        name: "text-2xl font-serif",
        sectionTitle: "text-base font-bold capitalize border-b-2 border-gray-400",
        itemTitle: "font-semibold text-base",
        skillItem: "text-xs bg-gray-200 px-2 py-1 rounded-sm"
      };

    case "creative":
      return {
        ...baseStyles,
        container: "bg-gradient-to-br from-white to-purple-50",
        header: "text-left",
        name: "text-2xl font-bold text-purple-700",
        contactInfo: "text-sm text-gray-600 justify-start",
        sectionTitle: "text-sm font-bold text-purple-700 border-b border-purple-200 inline-block",
        skillItem: "text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full"
      };

    case "minimal":
      return {
        ...baseStyles,
        container: "bg-white",
        header: "text-center",
        name: "text-xl font-light",
        sectionTitle: "text-xs font-medium uppercase tracking-wider border-b-0",
        skillItem: "text-xs px-0 py-0 bg-transparent underline"
      };

    case "executive":
      return {
        ...baseStyles,
        container: "bg-gray-50",
        header: "text-center bg-gray-800 text-white p-4 mb-6",
        name: "text-2xl font-bold",
        contactInfo: "text-sm text-gray-300 justify-center",
        sectionTitle: "text-sm font-bold uppercase border-b-2 border-gray-400",
        skillItem: "text-xs bg-gray-200 px-2 py-1 rounded-none"
      };

    case "technical":
      return {
        ...baseStyles,
        container: "bg-white",
        header: "text-left border-l-4 border-green-600 pl-4",
        name: "text-xl font-mono font-bold",
        contactInfo: "text-sm font-mono text-gray-600 justify-start",
        sectionTitle: "text-sm font-bold font-mono text-green-700 border-b border-green-200",
        skillItem: "text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded"
      };

    default:
      return baseStyles;
  }
}

