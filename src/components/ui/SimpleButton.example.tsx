/**
 * SimpleButton 組件使用範例
 * 展示不同尺寸和樣式的按鈕變體
 */

import { SimpleButton } from "./SimpleButton";

export const SimpleButtonExample = () => {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="mb-4 text-xl font-semibold">尺寸變體</h2>
        <div className="flex items-center gap-4">
          <SimpleButton size="sm">小按鈕</SimpleButton>
          <SimpleButton size="md">中按鈕</SimpleButton>
          <SimpleButton size="lg">大按鈕</SimpleButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">樣式變體</h2>
        <div className="flex items-center gap-4">
          <SimpleButton variant="primary">主要按鈕</SimpleButton>
          <SimpleButton variant="secondary">次要按鈕</SimpleButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">組合變體</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <SimpleButton size="sm" variant="primary">
              小主要
            </SimpleButton>
            <SimpleButton size="sm" variant="secondary">
              小次要
            </SimpleButton>
          </div>
          <div className="flex items-center gap-4">
            <SimpleButton size="md" variant="primary">
              中主要
            </SimpleButton>
            <SimpleButton size="md" variant="secondary">
              中次要
            </SimpleButton>
          </div>
          <div className="flex items-center gap-4">
            <SimpleButton size="lg" variant="primary">
              大主要
            </SimpleButton>
            <SimpleButton size="lg" variant="secondary">
              大次要
            </SimpleButton>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">事件處理</h2>
        <div className="flex items-center gap-4">
          <SimpleButton
            onClick={() => alert("按鈕被點擊了！")}
            variant="primary"
          >
            點擊我
          </SimpleButton>
          <SimpleButton disabled variant="secondary">
            禁用狀態
          </SimpleButton>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">自訂樣式</h2>
        <div className="flex items-center gap-4">
          <SimpleButton
            className="border-blue-500 bg-blue-600 hover:bg-blue-700"
            variant="primary"
          >
            自訂藍色
          </SimpleButton>
          <SimpleButton
            className="bg-green-600 text-white hover:bg-green-700"
            variant="secondary"
          >
            自訂綠色
          </SimpleButton>
        </div>
      </section>
    </div>
  );
};
