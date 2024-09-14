import { DataTable, DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputText } from 'primereact/inputtext';

interface IProduct {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
}

interface IMetadata {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
  next_url: string;
}

interface AxiosResponse {
  pagination: IMetadata;
  data: IProduct[];
}

export default function ProductList() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState<IMetadata | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);
  const [first, setFirst] = useState(0);
  const [numRows, setNumRows] = useState(0);
  const [count, setCount] = useState(0);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get<AxiosResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${page}`
        );
        setMetadata(data.pagination);
        setProducts(data.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [page, count]);

  const onPageChange = (e: DataTableStateEvent) => {
    setPage((e.page as number) + 1);
    setFirst(e.first);
  };

  const handleSelectRows = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await axios.get<AxiosResponse>(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${numRows}`
      );

      const fetchedRows = data.data;

      setSelectedProducts((prevSelectedProducts) => {
        const updatedSelectedProducts = [
          ...prevSelectedProducts,
          ...fetchedRows,
        ];

        return updatedSelectedProducts.filter(
          (row, index, self) => index === self.findIndex((r) => r.id === row.id)
        );
      });

      setCount((prev) => prev + 1);
      setNumRows(0);
      if (op.current) op.current.hide();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <div>
        <Button
          type="button"
          icon="pi pi-image"
          label="Select rows"
          onClick={(e) => op.current && op.current.toggle(e)}
        />
        <OverlayPanel ref={op}>
          <form onSubmit={handleSelectRows}>
            <InputText
              autoFocus
              className="mr-2"
              keyfilter="int"
              placeholder="Select rows..."
              value={numRows.toString()}
              onChange={(e) => setNumRows(Number(e.target.value))}
            />
            <Button type="submit">Submit</Button>
          </form>
        </OverlayPanel>
      </div>

      <DataTable
        key={selectedProducts.length}
        value={products}
        paginator
        rows={12}
        selectionMode="checkbox"
        selection={selectedProducts}
        onSelectionChange={(e) => setSelectedProducts(e.value)}
        tableStyle={{ minWidth: '50rem' }}
        onPage={onPageChange}
        totalRecords={metadata?.total}
        lazy={true}
        first={first}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="id" header="ID" />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place Of Origin" />
        <Column field="artist_display" header="Artist Display" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
}
