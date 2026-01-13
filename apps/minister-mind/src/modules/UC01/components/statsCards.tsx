
const statsCards = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">مسودات قيد الإعداد</p>
      <p className="text-3xl font-bold text-[#00A991]">12</p>
    </div>
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">طلبات قيد المراجعة</p>
      <p className="text-3xl font-bold text-[#00A991]">10</p>
    </div>
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">طلبات معادة للتعديل</p>
      <p className="text-3xl font-bold text-[#00A991]">08</p>
    </div>
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">اجتماعات مجدولة</p>
      <p className="text-3xl font-bold text-[#00A991]">14</p>
    </div>
  </div>
  )
}

export default statsCards