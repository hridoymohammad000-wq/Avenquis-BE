import React from "react";
import { Users, Calendar, PieChart, FileText } from "lucide-react";
import { FEATURES } from "../data/content";
import { FeatureItem } from "../types";

interface FeatureCardsProps {
  onSelectFeature?: (feature: FeatureItem) => void;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({
  onSelectFeature,
}) => {
  const getIcon = (iconName: FeatureItem["iconName"], colorHex: string) => {
    switch (iconName) {
      case "users":
        return <Users className="w-5 h-5" style={{ color: colorHex }} />;
      case "calendar":
        return <Calendar className="w-5 h-5" style={{ color: colorHex }} />;
      case "pie-chart":
        return <PieChart className="w-5 h-5" style={{ color: colorHex }} />;
      case "file-text":
        return <FileText className="w-5 h-5" style={{ color: colorHex }} />;
    }
  };

  return (
    <div className="w-full mt-4">
      {/* 4 Feature Micro-Cards: 2x2 grid matching Natural Tones theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        {FEATURES.map((item) => {
          return (
            <div
              key={item.id}
              id={`feature-card-${item.id}`}
              onClick={() => onSelectFeature?.(item)}
              style={{ backgroundColor: item.badge.bg }}
              className="p-4 rounded-2xl flex items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs text-left"
            >
              {/* White Icon Container with subtle shadow */}
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mr-3 shadow-xs shrink-0">
                {getIcon(item.iconName, item.badge.text)}
              </div>

              {/* Title & Micro metric/subtitle */}
              <div className="overflow-hidden">
                <h3
                  className="text-xs font-bold leading-tight truncate"
                  style={{ color: item.badge.text }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[10px] opacity-75 font-medium mt-0.5 leading-tight truncate"
                  style={{ color: item.badge.text }}
                >
                  {item.metrics || item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
