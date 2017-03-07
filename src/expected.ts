"use strict";

export interface Expected<TR, TE> {
    success: boolean;
    value?: TR;
    errors?: Array<TE>;
}
