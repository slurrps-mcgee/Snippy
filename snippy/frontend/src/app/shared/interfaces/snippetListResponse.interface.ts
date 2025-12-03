import { SnippetList } from "./snippetList.interface";

export interface SnippetListResponse {
    success: boolean;
    snippets: SnippetList[];
    totalCount: number;
}