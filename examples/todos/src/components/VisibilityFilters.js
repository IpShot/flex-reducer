import React from "react";
import cx from "classnames";
import { useSelector } from "../flex-reducer";
import { setFilter } from "../actions";
import { VISIBILITY_FILTERS } from "../constants";

const VisibilityFilters = () => {
  const filter = useSelector(state => state.app.filter);
  return (
    <div className="visibility-filters">
      {Object.keys(VISIBILITY_FILTERS).map(filterKey => {
        const currentFilter = VISIBILITY_FILTERS[filterKey];
        return (
          <span
            key={`visibility-filter-${currentFilter}`}
            className={cx(
              "filter",
              currentFilter === filter && "filter--active"
            )}
            onClick={() => setFilter(currentFilter)}
          >
            {currentFilter}
          </span>
        );
      })}
    </div>
  );
};

export default VisibilityFilters;
