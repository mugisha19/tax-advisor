package com.rra.taxprofessionals.enums;

public enum BachelorDegree {
    ACCOUNTING("Accounting"),
    LAW("Law"),
    TAXATION("Taxation"),
    FINANCE("Finance"),
    ECONOMICS("Economics"),
    COMMERCE("Commerce"),
    MANAGEMENT("Management");

    private final String displayName;

    BachelorDegree(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
