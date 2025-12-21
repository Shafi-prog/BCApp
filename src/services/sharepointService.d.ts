export interface SchoolInfo {
    Id: number;
    Title: string;
    SchoolName: string;
    SchoolID: string;
    Level: string;
    SchoolGender: string;
    SchoolType: string;
    EducationType: string;
    StudyTime: string;
    BuildingOwnership: string;
    SectorDescription: string;
    PrincipalName: string;
    PrincipalID: string;
    principalEmail: string;
    PrincipalPhone: string;
    SchoolEmail: string;
    Latitude: string;
    UnifiedSupportTicketNumber?: number;
    IncidentNumber?: number;
}
export interface TeamMember {
    Id?: number;
    Title: string;
    JobRole: string;
    MembershipType: string;
    SchoolName_Ref?: string;
    MemberEmail?: string;
    MemberMobile?: string;
    HasAttachments?: boolean;
    SharePointLink?: string;
}
export interface Drill {
    Id?: number;
    Title: string;
    SchoolName_Ref?: string;
    DrillHypothesis?: string;
    SpecificEvent?: string;
    TargetGroup?: string;
    ExecutionDate?: string;
    AttachmentUrl?: string;
    HasAttachments?: boolean;
    SharePointLink?: string;
    Created?: string;
}
export interface Incident {
    Id?: number;
    Title: string;
    SchoolName_Ref?: string;
    IncidentCategory?: string;
    RiskLevel?: string;
    AlertModelType?: string;
    HazardDescription?: string;
    ActivatedAlternative?: string;
    ActivationTime?: string;
    ClosureTime?: string;
    CoordinatedEntities?: string;
    AltLocation?: string;
    CommunicationDone?: boolean;
    Challenges?: string;
    LessonsLearned?: string;
    Suggestions?: string;
    UnifiedSupportTicketNumber?: number;
    IncidentNumber?: number;
    SharePointLink?: string;
    HasAttachments?: boolean;
    Status?: string;
    Created?: string;
}
export interface TrainingProgram {
    Id?: number;
    Title: string;
    ProviderEntity?: string;
    ActivityType?: string;
    TargetAudience?: string;
    Date?: string;
    ExecutionMode?: string;
    CoordinationStatus?: string;
    Status?: string;
}
export interface TrainingLog {
    Id?: number;
    Title: string;
    Program_Ref?: string;
    Program_RefId?: number;
    SchoolName_Ref?: string;
    RegistrationType?: string;
    AttendeesNames?: string;
    TrainingDate?: string;
    Status?: string;
}
export interface ChoiceOption {
    key: string;
    text: string;
}
export declare const SharePointService: {
    getIncidentCategoryOptions: () => ChoiceOption[];
    getRiskLevelOptions: () => ChoiceOption[];
    getAlertModelTypeOptions: () => ChoiceOption[];
    getActivatedAlternativeOptions: () => ChoiceOption[];
    getCoordinatedEntitiesOptions: () => ChoiceOption[];
    getAltLocationOptions: () => ChoiceOption[];
    getDrillHypothesisOptions: () => ChoiceOption[];
    getTargetGroupOptions: () => ChoiceOption[];
    getSchoolInfo(schoolName?: string): Promise<SchoolInfo[]>;
    getTeamMembers(schoolName?: string): Promise<TeamMember[]>;
    createTeamMember(member: TeamMember, schoolId?: number): Promise<any>;
    updateTeamMember(id: number, member: TeamMember, schoolId?: number): Promise<any>;
    deleteTeamMember(id: number): Promise<void>;
    getDrills(schoolName?: string): Promise<Drill[]>;
    createDrill(drill: Drill, schoolId?: number): Promise<any>;
    updateDrill(id: number, drill: Drill, schoolId?: number): Promise<any>;
    deleteDrill(id: number): Promise<void>;
    getIncidents(schoolName?: string): Promise<Incident[]>;
    createIncident(incident: Incident, schoolId?: number): Promise<any>;
    updateIncident(id: number, incident: Incident, schoolId?: number): Promise<any>;
    uploadIncidentFile(itemId: number, fieldName: 'DecisionFile' | 'RecoveryFile', file: File): Promise<void>;
    deleteIncident(id: number): Promise<void>;
    getTrainingPrograms(availableOnly?: boolean): Promise<TrainingProgram[]>;
    getTrainingLog(schoolName?: string): Promise<TrainingLog[]>;
    registerForTraining(schoolName: string, programId: number, attendeeIds: number[], schoolId?: number, registrationType?: string, trainingDate?: string): Promise<any>;
    updateTrainingLog(id: number, updates: {
        attendeeIds?: number[];
    }): Promise<any>;
    deleteTrainingLog(id: number): Promise<void>;
    isLocalDevelopment: () => boolean;
    testConnection(): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getLists(): Promise<string[]>;
};
export default SharePointService;
